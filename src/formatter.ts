import { Dirent } from "fs";

type OutputFormat = "path" | "tsv" | "json";

export default function formatter(
  directories: Dirent[],
  format: OutputFormat = "path",
): string {
  if (format === "tsv") {
    return directories
      .map((dir) => `${dir.name}\t${dir.path}/${dir.name}`)
      .join("\n");
  } else {
    return directories.map((dir) => `${dir.path}/${dir.name}`).join("\n");
  }
}
