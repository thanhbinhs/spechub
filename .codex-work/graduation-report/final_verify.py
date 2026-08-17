#!/usr/bin/env python3
"""Read-only final checks for the generated Spechub graduation report."""

from __future__ import annotations

import argparse
import hashlib
import io
import json
import re
from pathlib import Path
from zipfile import ZipFile

from PIL import Image
from pypdf import PdfReader


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def is_grayscale(payload: bytes) -> bool:
    with Image.open(io.BytesIO(payload)) as image:
        rgb = image.convert("RGB")
        return all(red == green == blue for red, green, blue in rgb.getdata())


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--docx", type=Path, required=True)
    parser.add_argument("--pdf", type=Path, required=True)
    parser.add_argument("--template-a", type=Path, required=True)
    parser.add_argument("--template-a-original", type=Path, required=True)
    parser.add_argument("--template-b", type=Path, required=True)
    parser.add_argument("--template-b-original", type=Path, required=True)
    args = parser.parse_args()

    with ZipFile(args.docx) as archive:
        names = archive.namelist()
        media_names = sorted(name for name in names if name.startswith("word/media/"))
        nongrayscale = [name for name in media_names if not is_grayscale(archive.read(name))]
        forbidden_parts = [
            name
            for name in names
            if name.startswith("customXml/")
            or re.search(r"word/(comments|footnotes|endnotes)", name, re.I)
        ]

    reader = PdfReader(str(args.pdf))
    text = "\n".join(page.extract_text() or "" for page in reader.pages)
    forbidden_terms = [
        "Phạm Thành Trung",
        "Bùi Vương Trưởng",
        "đặt vé",
        "GameTech",
        "OptaPlanner",
        "{{",
        "[[PAGE:",
        "Lorem",
        "TODO",
    ]
    found_terms = [term for term in forbidden_terms if term.casefold() in text.casefold()]
    wrong_heading = bool(
        re.search(
            r"CHƯƠNG\s+\d+\.\s+(TÓM TẮT|LỜI CAM ĐOAN|LỜI CẢM ƠN|MỤC LỤC)",
            text,
            re.I,
        )
    )
    required_terms = [
        "CHƯƠNG 1. TỔNG QUAN VỀ ĐỀ TÀI",
        "CHƯƠNG 2. CƠ SỞ LÝ THUYẾT VÀ CÔNG NGHỆ",
        "CHƯƠNG 3. PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG",
        "CHƯƠNG 4. PHÁT TRIỂN VÀ KẾT QUẢ",
        "KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN",
        "PHỤ LỤC B. DANH MỤC MÔ HÌNH DỮ LIỆU",
    ]
    missing_required = [term for term in required_terms if term.casefold() not in text.casefold()]

    template_hashes = {
        "template_a": sha256(args.template_a),
        "template_a_original": sha256(args.template_a_original),
        "template_b": sha256(args.template_b),
        "template_b_original": sha256(args.template_b_original),
    }
    result = {
        "docx": str(args.docx),
        "docx_size_bytes": args.docx.stat().st_size,
        "docx_sha256": sha256(args.docx),
        "pdf_pages": len(reader.pages),
        "extracted_text_characters": len(text),
        "media_files": len(media_names),
        "nongrayscale_media": nongrayscale,
        "forbidden_package_parts": forbidden_parts,
        "forbidden_terms_found": found_terms,
        "wrong_inherited_heading": wrong_heading,
        "missing_required_sections": missing_required,
        "template_hashes": template_hashes,
        "templates_unchanged": (
            template_hashes["template_a"] == template_hashes["template_a_original"]
            and template_hashes["template_b"] == template_hashes["template_b_original"]
        ),
    }
    result["passed"] = all(
        [
            result["pdf_pages"] == 82,
            not nongrayscale,
            not forbidden_parts,
            not found_terms,
            not wrong_heading,
            not missing_required,
            result["templates_unchanged"],
        ]
    )
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
