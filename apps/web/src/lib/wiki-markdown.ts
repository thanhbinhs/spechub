export type WikiHeading = {
  level: 2 | 3;
  title: string;
  id: string;
  line: number;
};

export function wikiHeadingId(value: string) {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "muc"
  );
}

export function uniqueWikiHeadingId(
  title: string,
  counts: Map<string, number>,
) {
  const base = wikiHeadingId(title);
  const nextCount = (counts.get(base) ?? 0) + 1;
  counts.set(base, nextCount);
  return nextCount === 1 ? base : `${base}-${nextCount}`;
}

export function extractWikiHeadings(markdown: string): WikiHeading[] {
  const headings: WikiHeading[] = [];
  const counts = new Map<string, number>();
  let activeFence = "";

  for (const [lineIndex, line] of markdown.split("\n").entries()) {
    const fence = /^\s*(`{3,}|~{3,})/.exec(line)?.[1] ?? "";
    if (fence) {
      if (!activeFence) activeFence = fence[0]!;
      else if (fence[0] === activeFence) activeFence = "";
      continue;
    }
    if (activeFence) continue;

    const match = /^(#{2,3})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!match) continue;
    const title = match[2]
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/[*_`~]/g, "")
      .trim();
    if (!title) continue;
    headings.push({
      level: match[1].length as 2 | 3,
      title,
      id: uniqueWikiHeadingId(title, counts),
      line: lineIndex + 1,
    });
  }

  return headings;
}
