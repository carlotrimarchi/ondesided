import { Dirent } from "fs";

export default function formatter(directories: Dirent[]): string {
  return directories.map((dir) => `${dir.path}/${dir.name}`).join("\n");
}
