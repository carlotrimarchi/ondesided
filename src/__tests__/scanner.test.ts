import { it, expect } from "vitest";
import { vol, fs } from "memfs";

it("should find all git repositories in folder", () => {
  const projectsDir = "/projects";
  const mockFileSystem = {
    "project1/.git/config": "",
    "project2/.git/config": "",
    "project3/.git/config": "",
    "dir1/main.js": "console.log('hello')",
    "dir2/index.js": "console.log('world')",
    "empty-dir/.gitkeep": "",
  };

  vol.fromJSON(mockFileSystem, projectsDir);

  const allDirectories = fs.readdirSync(projectsDir, { withFileTypes: true });
  const projectDirectories = allDirectories.filter((dir) =>
    fs.readdirSync(`${projectsDir}/${dir.name}`).includes(".git"),
  );

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
