import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  systemTemplateSchema,
  type SystemTemplate,
} from "@plyco/shared";

import { ApiError } from "./errors.js";

const DEFAULT_TEMPLATE_DIRECTORY = fileURLToPath(
  new URL("../data/templates/", import.meta.url),
);

export interface SystemTemplateSource {
  listSystemTemplates(): Promise<SystemTemplate[]>;
}

export class FileSystemTemplateSource implements SystemTemplateSource {
  constructor(private readonly directory = DEFAULT_TEMPLATE_DIRECTORY) {}

  async listSystemTemplates(): Promise<SystemTemplate[]> {
    const entries = await readdir(this.directory, { withFileTypes: true });
    const templates = await Promise.all(
      entries
        .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
        .map(async (entry) => {
          const content = await readFile(join(this.directory, entry.name), "utf8");
          return parseSystemTemplate(content, entry.name);
        }),
    );

    return templates.sort((left, right) => left.name.localeCompare(right.name));
  }
}

export class StaticSystemTemplateSource implements SystemTemplateSource {
  constructor(private readonly templates: SystemTemplate[] = []) {}

  async listSystemTemplates(): Promise<SystemTemplate[]> {
    return [...this.templates].sort((left, right) =>
      left.name.localeCompare(right.name),
    );
  }
}

export function parseSystemTemplate(
  rawContent: string,
  filename = "system template",
): SystemTemplate {
  const lines = rawContent.split(/\r?\n/);
  const metadata = new Map<string, string>();
  let bodyStart = 0;

  for (const [index, line] of lines.entries()) {
    const trimmed = line.trim();

    if (index === 0 && trimmed === "---") {
      continue;
    }

    if (index > 0 && trimmed === "---") {
      bodyStart = index + 1;
      break;
    }

    if (!trimmed) {
      bodyStart = index + 1;
      break;
    }

    const normalized = trimmed.replace(/^['#]\s?/, "");
    const match = normalized.match(/^([a-zA-Z][a-zA-Z0-9_-]*):\s*(.+)$/);

    if (!match) {
      bodyStart = index;
      break;
    }

    const [, key, value] = match;
    metadata.set(key ?? "", value?.trim() ?? "");
    bodyStart = index + 1;
  }

  const parsed = systemTemplateSchema.safeParse({
    slug: metadata.get("slug"),
    name: metadata.get("name"),
    description: metadata.get("description"),
    content: lines.slice(bodyStart).join("\n").trimStart(),
  });

  if (!parsed.success) {
    throw new ApiError(
      "SYSTEM_TEMPLATE_INVALID",
      `System template ${filename} has invalid metadata.`,
      500,
      parsed.error.flatten(),
    );
  }

  return parsed.data;
}
