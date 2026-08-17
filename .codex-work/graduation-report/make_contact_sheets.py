from __future__ import annotations

import argparse
import math
import re
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


FONT = "/System/Library/Fonts/Supplemental/Arial.ttf"
FONT_BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"


def page_number(path: Path):
    match = re.search(r"page-(\d+)\.png$", path.name)
    return int(match.group(1)) if match else 0


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("render_dir")
    parser.add_argument("output_dir")
    parser.add_argument("--per-sheet", type=int, default=12)
    args = parser.parse_args()
    render_dir = Path(args.render_dir)
    out_dir = Path(args.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    pages = sorted(render_dir.glob("page-*.png"), key=page_number)
    cols = 3
    rows = math.ceil(args.per_sheet / cols)
    thumb_w, thumb_h = 420, 594
    pad, label_h = 26, 36
    sheet_w = cols * (thumb_w + pad) + pad
    sheet_h = rows * (thumb_h + label_h + pad) + pad
    label_font = ImageFont.truetype(FONT_BOLD, 22)
    for start in range(0, len(pages), args.per_sheet):
        batch = pages[start:start + args.per_sheet]
        sheet = Image.new("RGB", (sheet_w, sheet_h), "#E9EEF3")
        draw = ImageDraw.Draw(sheet)
        for idx, path in enumerate(batch):
            row, col = divmod(idx, cols)
            x = pad + col * (thumb_w + pad)
            y = pad + row * (thumb_h + label_h + pad)
            with Image.open(path) as im:
                im = im.convert("RGB")
                im.thumbnail((thumb_w, thumb_h))
                ox = x + (thumb_w - im.width) // 2
                oy = y + (thumb_h - im.height) // 2
                sheet.paste(im, (ox, oy))
            label = f"Trang vật lý {page_number(path)}"
            draw.text((x + 8, y + thumb_h + 6), label, font=label_font, fill="#17375E")
        index = start // args.per_sheet + 1
        sheet.save(out_dir / f"contact-{index:02d}.png", optimize=True)
    print(f"{len(pages)} pages -> {math.ceil(len(pages) / args.per_sheet)} contact sheets")


if __name__ == "__main__":
    main()
