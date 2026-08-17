from __future__ import annotations

import argparse
import json
import re
from pathlib import Path


def roman(number: int) -> str:
    values = [
        (1000, "m"), (900, "cm"), (500, "d"), (400, "cd"),
        (100, "c"), (90, "xc"), (50, "l"), (40, "xl"),
        (10, "x"), (9, "ix"), (5, "v"), (4, "iv"), (1, "i"),
    ]
    out = []
    for value, token in values:
        while number >= value:
            out.append(token)
            number -= value
    return "".join(out)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("text")
    parser.add_argument("output")
    args = parser.parse_args()
    pages = Path(args.text).read_text(encoding="utf-8").split("\f")
    physical: dict[str, int] = {}
    for index, page in enumerate(pages, 1):
        for key in re.findall(r"\[\[PAGE:([^]]+)\]\]", page):
            physical[key] = index
    if "summary" not in physical or "opening" not in physical:
        raise SystemExit("Missing summary/opening markers")
    prelim_start = physical["summary"]
    body_start = physical["opening"]
    display: dict[str, str] = {}
    for key, page in sorted(physical.items()):
        if page >= body_start:
            display[key] = str(page - body_start + 1)
        else:
            display[key] = roman(page - prelim_start + 1)
    payload = {
        "_meta": {
            "physical_pages": len([p for p in pages if p.strip()]),
            "prelim_start_physical": prelim_start,
            "body_start_physical": body_start,
            "marker_count": len(physical),
        },
        **display,
    }
    Path(args.output).write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(payload["_meta"], ensure_ascii=False))


if __name__ == "__main__":
    main()
