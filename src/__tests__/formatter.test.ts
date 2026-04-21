import { describe, expect, it } from "vitest";
import formatter, { pickPropValue, setProp } from "../formatter.js";
import type { Project } from "../scanner.js";

const mockProjects: Project[] = [
	{
		name: "project1",
		path: "/projects/project1",
		isGitRepo: true,
		git: { branch: "main", lastCommitMessage: "fix: bug", lastCommitDate: new Date("2026-01-15T10:30:00Z"), isDirty: false },
	},
	{
		name: "project2",
		path: "/projects/project2",
		isGitRepo: true,
		git: { branch: "dev", lastCommitMessage: "feat: new", lastCommitDate: new Date("2026-01-14T09:00:00Z"), isDirty: true },
	},
	{
		name: "project3",
		path: "/projects/project3",
		isGitRepo: false,
		git: null,
	},
];

describe("pickPropValue", () => {
	const project = mockProjects[0]!;

	it("returns a top-level property", () => {
		expect(pickPropValue(project, "name")).toBe("project1");
	});

	it("returns a nested property", () => {
		expect(pickPropValue(project, "git.branch")).toBe("main");
	});

	it("returns null for non-existent property", () => {
		expect(pickPropValue(project, "notAProp")).toBeNull();
		expect(pickPropValue(project, "git.notAProp")).toBeNull();
	});

	it("returns null for null property", () => {
		expect(pickPropValue(mockProjects[2]!, "git.branch")).toBeNull();
	});

	it("returns a Date property", () => {
		expect(pickPropValue(project, "git.lastCommitDate")).toBe(project.git!.lastCommitDate);
	});

	it("returns a boolean property", () => {
		expect(pickPropValue(project, "git.isDirty")).toBe(false);
	});
});

describe("setProp", () => {
	it("sets a top-level property on an empty object", () => {
		const obj: any = {};
		setProp(obj, ["name"], "project-1");
		expect(obj).toEqual({ name: "project-1" });
	});

	it("sets a nested property on an empty object", () => {
		const obj: any = {};
		setProp(obj, ["git", "branch"], "main");
		expect(obj).toEqual({ git: { branch: "main" } });
	});

	it("sets multiple nested properties on the same object", () => {
		const obj: any = {};
		setProp(obj, ["git", "branch"], "main");
		setProp(obj, ["git", "isDirty"], true);
		expect(obj).toEqual({ git: { branch: "main", isDirty: true } });
	});

	it("overwrites an existing property", () => {
		const obj: any = { name: "old" };
		setProp(obj, ["name"], "new");
		expect(obj).toEqual({ name: "new" });
	});

	it("does not affect unrelated properties", () => {
		const obj: any = { foo: "foo" };
		setProp(obj, ["bar"], "bar");
		expect(obj).toEqual({ foo: "foo", bar: "bar" });
	});

	it("creates intermediate objects if missing", () => {
		const obj: any = { git: null };
		setProp(obj, ["git", "branch"], "main");
		expect(obj).toEqual({ git: { branch: "main" } });
	});
});

describe("formatter", () => {

	describe("pretty format (default)", () => {
		it("should include a counter for each project", () => {
			const result = formatter(mockProjects, "pretty", "minimal");
			expect(result).toContain("#1");
			expect(result).toContain("#2");
			expect(result).toContain("#3");
		});

		it("should show name as top-level and path indented", () => {
			const result = formatter(mockProjects, "pretty", "minimal");
			const lines = result.trim().split("\n");
			const projectLine = lines.find(l => l.startsWith("Project:"))!;
			const pathLine = lines.find(l => l.trimStart().startsWith("Path:"))!;
			expect(projectLine).toBeDefined();
			expect(pathLine.startsWith("  ")).toBe(true);
		});

		it("should align values at the same column", () => {
			const result = formatter(mockProjects, "pretty", "full");
			const lines = result.trim().split("\n").filter(l => l.includes(":"));
			const valueColumns = lines.map(l => l.indexOf(":") + 1 + l.slice(l.indexOf(":") + 1).match(/^ */)![0].length);
			expect(new Set(valueColumns).size).toBe(1);
		});

		it("should show git fields with full detail", () => {
			const result = formatter(mockProjects, "pretty", "full");
			expect(result).toContain("main");
			expect(result).toContain("fix: bug");
		});

		it("should return an empty string when no projects are found", () => {
			const result = formatter([], "pretty");
			expect(result).toBe("");
		});
	});

	describe("tsv format", () => {
		it("should return one path per line with path-only detail", () => {
			const result = formatter(mockProjects, "tsv", "path-only");
			expect(result).toBe(
				"/projects/project1\n/projects/project2\n/projects/project3",
			);
		});

		it("should return name and path separated by tabs with minimal detail", () => {
			const result = formatter(mockProjects, "tsv", "minimal");
			expect(result).toBe(
				"project1\t/projects/project1\nproject2\t/projects/project2\nproject3\t/projects/project3",
			);
		});

		it("should return an empty string when no projects are found", () => {
			const result = formatter([], "tsv");
			expect(result).toBe("");
		});
	});

	describe("json format", () => {
		it("should return only paths with path-only detail", () => {
			const parsed = JSON.parse(formatter(mockProjects, "json", "path-only"));
			expect(parsed).toEqual([
				{ path: "/projects/project1" },
				{ path: "/projects/project2" },
				{ path: "/projects/project3" },
			]);
		});

		it("should return name and path with minimal detail", () => {
			const parsed = JSON.parse(formatter(mockProjects, "json", "minimal"));
			expect(parsed).toEqual([
				{ name: "project1", path: "/projects/project1" },
				{ name: "project2", path: "/projects/project2" },
				{ name: "project3", path: "/projects/project3" },
			]);
		});

		it("should return name, path, isGitRepo and last commit date with simple detail", () => {
			const parsed = JSON.parse(formatter(mockProjects, "json", "simple"));
			expect(parsed[0]).toMatchObject({
				name: "project1",
				path: "/projects/project1",
				isGitRepo: true,
				git: { lastCommitDate: "2026-01-15T10:30:00.000Z" },
			});
		});

		it("should return all git fields with full detail", () => {
			const parsed = JSON.parse(formatter(mockProjects, "json", "full"));
			expect(parsed[0]).toEqual({
				name: "project1",
				path: "/projects/project1",
				isGitRepo: true,
				git: { branch: "main", lastCommitMessage: "fix: bug", lastCommitDate: "2026-01-15T10:30:00.000Z", isDirty: false },
			});
		});

		it("should include isGitRepo false and null git fields for non-git projects", () => {
			const parsed = JSON.parse(formatter(mockProjects, "json", "full"));
			expect(parsed[2]).toEqual({
				name: "project3",
				path: "/projects/project3",
				isGitRepo: false,
				git: { branch: null, lastCommitMessage: null, lastCommitDate: null, isDirty: null },
			});
		});

		it("should return an empty array when no projects are found", () => {
			expect(JSON.parse(formatter([], "json"))).toEqual([]);
		});
	});

	it("should throw an error for invalid formats", () => {
		expect(() => formatter(mockProjects, "invalid" as any)).toThrow("Invalid format");
	});
});
