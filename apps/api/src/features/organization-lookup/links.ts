export const normalizeWebsiteLink = (value: string, baseUrl: string) => {
  if (!value.trim() || value.trim().startsWith("#")) return null;

  try {
    const url = new URL(value.trim(), baseUrl);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
      return null;
    }

    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
};

export const extractWebsiteLinks = (
  markdown: string,
  links: string[],
  baseUrl: string,
) => {
  const candidates = [...links];
  const inlineLinks = /(?<!!)\[[^\]]*\]\(\s*(<[^>]+>|(?:[^()\s]|\([^()\s]*\))+)(?:\s+["'][^"']*["'])?\s*\)/g;
  const referenceLinks = /^\s*\[[^\]]+\]:\s*<?([^\s<>]+)>?/gm;
  const absoluteLinks = /https?:\/\/[^\s<>"`]+/g;

  for (const match of markdown.matchAll(inlineLinks)) {
    candidates.push(match[1]!.replace(/^<|>$/g, ""));
  }
  for (const match of markdown.matchAll(referenceLinks)) {
    candidates.push(match[1]!);
  }
  for (const match of markdown.matchAll(absoluteLinks)) {
    let link = match[0].replace(/[.,;!?]+$/, "");
    // A markdown closing parenthesis is not part of the destination URL.
    while (
      link.endsWith(")") &&
      (link.match(/\)/g)?.length ?? 0) > (link.match(/\(/g)?.length ?? 0)
    ) {
      link = link.slice(0, -1);
    }
    candidates.push(link);
  }

  return [...new Set(
    candidates
      .map((link) => normalizeWebsiteLink(link, baseUrl))
      .filter((link): link is string => link !== null),
  )];
};
