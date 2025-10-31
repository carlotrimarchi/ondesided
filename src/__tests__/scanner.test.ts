import { describe, it, expect, vi, beforeEach } from "vitest";
import { vol, fs } from "memfs";
import Scanner from "../scanner.js";

vi.mock("fs", async () => {
  const memfs = await import("memfs");
  return { default: memfs.fs };
});

describe("Scanner", () => {
  beforeEach(() => {
    vol.reset();
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

  it("should return an empty array when folder contains no git repositories", () => {
    const projectsDir = "/projects";
    const mockFileSystem = {
      "dir1/main.js": "console.log('hello')",
      "dir2/index.js": "console.log('world')",
      file1: "just a regular file",
    };
    vol.fromJSON(mockFileSystem, projectsDir);
    const scanner = new Scanner();

    const projectDirectories = scanner.scanFolder(projectsDir);

    expect(projectDirectories).toEqual([]);
  });

  it("should return an empty array when folder is empty", () => {
    const projectsDir = "/projects";
    // to simulate the empty directory I wanted to assign an empty object here
    // but in this case memfs doesn't create the directory at all, resulting in an error
    const mockFileSystem = { "/projects": null };

    vol.fromJSON(mockFileSystem, projectsDir);

    const scanner = new Scanner();

    const projectDirectories = scanner.scanFolder(projectsDir);

    expect(projectDirectories).toEqual([]);
  });
});
