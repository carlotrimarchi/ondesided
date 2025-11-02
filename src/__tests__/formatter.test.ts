import { describe, expect, it, vi, beforeEach } from "vitest";
import { vol, fs } from "memfs";
import Scanner from "../scanner.js";

vi.mock("fs", async () => {
  const memfs = await import("memfs");
  return { default: memfs.fs };
});

beforeEach(() => {
  vol.reset();
});

const projectsDir = "/projects";
const mockFileSystem = {
  "project1/.git/config": "",
  "project2/.git/config": "",
  "project3/.git/config": "",
  "dir1/main.js": "console.log('hello')",
  "dir2/index.js": "console.log('world')",
  "empty-dir/.gitkeep": "",
  file1: "just a regular file",
  file2: "another regular file",
  ".DS_Store": "",
};

it("should print a string of paths separated by a new line", () => {
  vol.fromJSON(mockFileSystem, projectsDir);
  const scanner = new Scanner();
  const projectDirectories = scanner.scanFolder(projectsDir);

  const output = projectDirectories
    .map((dir) => `${dir.path}/${dir.name}`)
    .join("\n");
  console.log(output);

  ("/projects/project1\n/projects/project2\n/projects/project3");
  expect(output).toBe(
    "/projects/project1\n/projects/project2\n/projects/project3",
  );
});
