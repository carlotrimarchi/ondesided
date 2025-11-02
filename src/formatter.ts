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
  } else if (format === "json") {
    const output = directories.map((dir) => {
      return {
        name: dir.name,
        path: `${dir.path}/${dir.name}`,
      };
    });
    return JSON.stringify(output);
  } else if (format === "path") {
    return directories.map((dir) => `${dir.path}/${dir.name}`).join("\n");
  } else {
    throw new Error(`Invalid format: ${format}. Use path, tsv, or json.`);
  }
}
