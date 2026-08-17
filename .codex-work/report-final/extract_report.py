#!/usr/bin/env python3
"""Extract a structured inventory from a DOCX and its rendered PDF."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

from docx import Document
from docx.document import Document as _Document
from docx.table import Table, _Cell
from docx.text.paragraph import Paragraph
from pypdf import PdfReader


VISUAL_RE = re.compile(
    r"(?:\bhình\b|\bfigure\b|\bsơ đồ\b|\bbiểu đồ\b|\buse\s*case\b|"
    r"\bsequence\b|\bclass\b|\berd\b|\bdatabase\b|\bcơ sở dữ liệu\b|"
    r"\bgiao diện\b|\bkiến trúc\b|\bdeployment\b)",
    re.IGNORECASE,
)


def iter_blocks(parent):
    if isinstance(parent, _Document):
        parent_elm = parent.element.body
    elif isinstance(parent, _Cell):
        parent_elm = parent._tc
    else:
        raise TypeError(f"Unsupported parent: {type(parent)!r}")

    for child in parent_elm.iterchildren():
        if child.tag.endswith("}p"):
            yield Paragraph(child, parent)
        elif child.tag.endswith("}tbl"):
            yield Table(child, parent)


def paragraph_record(p: Paragraph, index: int) -> dict:
    xml = p._p.xml
    return {
        "index": index,
        "style": p.style.name if p.style else "",
        "text": p.text,
        "drawing_count": xml.count("<w:drawing") + xml.count("<w:pict"),
        "page_break_before": bool(p.paragraph_format.page_break_before),
        "rendered_page_breaks": xml.count('w:type="page"'),
        "visual_mention": bool(VISUAL_RE.search(p.text)),
    }


def extract_docx(docx_path: Path) -> dict:
    doc = Document(docx_path)
    blocks = []
    paragraphs = []
    tables = []
    p_index = 0
    t_index = 0

    for block in iter_blocks(doc):
        if isinstance(block, Paragraph):
            rec = paragraph_record(block, p_index)
            blocks.append({"kind": "paragraph", **rec})
            paragraphs.append(rec)
            p_index += 1
        else:
            rows = []
            for row in block.rows:
                rows.append(["\n".join(p.text for p in cell.paragraphs) for cell in row.cells])
            rec = {
                "index": t_index,
                "rows": len(block.rows),
                "cols": max((len(row.cells) for row in block.rows), default=0),
                "text": rows,
                "style": block.style.name if block.style else "",
            }
            blocks.append({"kind": "table", **rec})
            tables.append(rec)
            t_index += 1

    styles = {}
    for p in paragraphs:
        styles[p["style"]] = styles.get(p["style"], 0) + 1

    return {
        "sections": len(doc.sections),
        "paragraph_count": len(paragraphs),
        "table_count": len(tables),
        "inline_shapes": len(doc.inline_shapes),
        "styles": dict(sorted(styles.items(), key=lambda item: (-item[1], item[0]))),
        "headings": [p for p in paragraphs if p["style"].startswith("Heading")],
        "visual_mentions": [p for p in paragraphs if p["visual_mention"]],
        "paragraphs": paragraphs,
        "tables": tables,
        "blocks": blocks,
    }


def extract_pdf(pdf_path: Path) -> list[dict]:
    pdf = PdfReader(str(pdf_path))
    pages = []
    for page_number, page in enumerate(pdf.pages, start=1):
        text = page.extract_text() or ""
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        pages.append(
            {
                "page": page_number,
                "text": text,
                "first_lines": lines[:12],
                "char_count": len(text),
                "visual_mentions": [line for line in lines if VISUAL_RE.search(line)],
            }
        )
    return pages


def write_markdown(docx_data: dict, pages: list[dict], out_path: Path) -> None:
    lines = [
        "# Report inventory",
        "",
        f"- Sections: {docx_data['sections']}",
        f"- Paragraphs: {docx_data['paragraph_count']}",
        f"- Tables: {docx_data['table_count']}",
        f"- Inline shapes: {docx_data['inline_shapes']}",
        f"- Rendered pages: {len(pages)}",
        "",
        "## Heading hierarchy",
        "",
    ]
    for h in docx_data["headings"]:
        lines.append(f"- p{h['index']} [{h['style']}] {h['text']}")

    lines.extend(["", "## Visual mentions by DOCX paragraph", ""])
    for p in docx_data["visual_mentions"]:
        lines.append(f"- p{p['index']} [{p['style']}] {p['text']}")

    lines.extend(["", "## Page text", ""])
    for page in pages:
        lines.extend([f"### Page {page['page']}", "", page["text"].rstrip(), ""])
    out_path.write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("docx", type=Path)
    parser.add_argument("pdf", type=Path)
    parser.add_argument("--json", required=True, type=Path)
    parser.add_argument("--markdown", required=True, type=Path)
    args = parser.parse_args()

    docx_data = extract_docx(args.docx)
    pages = extract_pdf(args.pdf)
    payload = {"docx": docx_data, "pages": pages}
    args.json.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    write_markdown(docx_data, pages, args.markdown)
    print(
        json.dumps(
            {
                "sections": docx_data["sections"],
                "paragraphs": docx_data["paragraph_count"],
                "tables": docx_data["table_count"],
                "inline_shapes": docx_data["inline_shapes"],
                "pages": len(pages),
                "headings": len(docx_data["headings"]),
                "visual_mentions": len(docx_data["visual_mentions"]),
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
