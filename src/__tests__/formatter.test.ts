import { describe, expect, it, vi, beforeEach } from "vitest";
import { vol, fs } from "memfs";
import Scanner from "../scanner.js";
import formatter from "../formatter.js";

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

it("should return a string of paths separated by a new line", () => {
  vol.fromJSON(mockFileSystem, projectsDir);
  const scanner = new Scanner();
  const projectDirectories = scanner.scanFolder(projectsDir);

  const output = formatter(projectDirectories);

  expect(output).toBe(
    "/projects/project1\n/projects/project2\n/projects/project3",
  );
});

it("should return an empty string when no projects are found", () => {
  const mockFileSystem = {
    "dir1/main.js": "console.log('hello')",
    "dir2/index.js": "console.log('world')",
    "empty-dir/.gitkeep": "",
    file1: "just a regular file",
    file2: "another regular file",
    ".DS_Store": "",
  };

  vol.fromJSON(mockFileSystem, projectsDir);
  const scanner = new Scanner();
  const projectDirectories = scanner.scanFolder(projectsDir);

  const output = formatter(projectDirectories);
  expect(output).toBe("");
});

it("should return name and path separated by tabs, one per line", () => {
  vol.fromJSON(mockFileSystem, projectsDir);
  const scanner = new Scanner();
  const projectDirectories = scanner.scanFolder(projectsDir);

  const output = formatter(projectDirectories, "tsv");
  expect(output).toBe(
    "project1\t/projects/project1\nproject2\t/projects/project2\nproject3\t/projects/project3",
  );
});
