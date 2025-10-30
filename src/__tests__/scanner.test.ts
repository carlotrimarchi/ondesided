import { it, expect, vi } from "vitest";
import { vol, fs } from "memfs";
import Scanner from "../scanner.ts";

vi.mock("fs", async () => {
  const memfs = await import("memfs");
  return { default: memfs.fs };
});

it("should find all git repositories in folder", () => {
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

  const scanner = new Scanner();

  vol.fromJSON(mockFileSystem, projectsDir);

  const projectDirectories = scanner.scanFolder(projectsDir);

  expect(projectDirectories).toContainEqual(
    expect.objectContaining({ name: "project1" }),
  );
  expect(projectDirectories).toContainEqual(
    expect.objectContaining({ name: "project2" }),
  );
  expect(projectDirectories).toContainEqual(
    expect.objectContaining({ name: "project3" }),
  );

  expect(projectDirectories.map((dir) => dir.name)).toEqual([
    "project1",
    "project2",
    "project3",
  ]);

  expect(projectDirectories).toHaveLength(3);
});
