import { describe, expect, it } from "vitest";
import { Dirent } from "fs";
import formatter from "../formatter.js";

describe("formatter", () => {
  const mockProjects = [
    { name: "project1", path: "/projects" },
    { name: "project2", path: "/projects" },
    { name: "project3", path: "/projects" },
  ] as Dirent[];

  describe("path format (default)", () => {
    it("should return a string of paths separated by a new line", () => {
      const result = formatter(mockProjects);

      expect(result).toBe(
        "/projects/project1\n/projects/project2\n/projects/project3",
      );
    });

    it("should return an empty string when no projects are found", () => {
      const mockProjects = [] as Dirent[];
      const result = formatter(mockProjects);
      expect(result).toBe("");
    });
  });

  describe("tsv format", () => {
    it("should return name and path separated by tabs, one per line", () => {
      const result = formatter(mockProjects, "tsv");
      expect(result).toBe(
        "project1\t/projects/project1\nproject2\t/projects/project2\nproject3\t/projects/project3",
      );
    });

    it("should return an empty string when no projects are found", () => {
      const mockProjects = [] as Dirent[];
      const result = formatter(mockProjects, "tsv");
      expect(result).toBe("");
    });
  });

  describe("json format", () => {
    it("should return a json array containing objects with project name and folder", () => {
      const result = formatter(mockProjects, "json");
      const parsed = JSON.parse(result);

      const expected = [
        { name: "project1", path: "/projects/project1" },
        { name: "project2", path: "/projects/project2" },
        { name: "project3", path: "/projects/project3" },
      ];

      expect(parsed).toEqual(expected);
    });

    it("should return an empty JSON string when no projects are found", () => {
      const mockProjects = [] as Dirent[];
      const result = formatter(mockProjects, "json");
      const parsed = JSON.parse(result);

      expect(parsed).toEqual([]);
    });
  });
});
