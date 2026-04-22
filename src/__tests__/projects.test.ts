import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import { sortProjects, addGitInfoToProject } from "../projects.js";
import type { Project } from "../scanner.js";

const makeProject = (
	name: string,
	date: Date | null = null,
	isGitRepo: boolean = false,
): Project => ({
	name,
	path: `/projects/${name}`,
	isGitRepo,
	git: isGitRepo
		? { branch: "main", lastCommitDate: date, lastCommitMessage: null, isDirty: false }
		: null,
});

describe("sortProjects", () => {
	it("sorts by date descending, most recent first", () => {
		const projects = [
			makeProject("old", new Date("2024-01-01"), true),
			makeProject("new", new Date("2026-01-01"), true),
			makeProject("mid", new Date("2025-01-01"), true),
		];
		const result = sortProjects(projects);
		expect(result.map((p) => p.name)).toEqual(["new", "mid", "old"]);
	});

	it("puts projects with a date before projects without", () => {
		const projects = [
			makeProject("no-date"),
			makeProject("has-date", new Date("2025-01-01"), true),
		];
		const result = sortProjects(projects);
		expect(result[0]!.name).toBe("has-date");
	});

	it("sorts projects without dates alphabetically", () => {
		const projects = [
			makeProject("banana"),
			makeProject("apple"),
			makeProject("mango"),
		];
		const result = sortProjects(projects);
		expect(result.map((p) => p.name)).toEqual(["apple", "banana", "mango"]);
	});
});

describe("addGitInfoToProject", () => {
	let repoPath: string;
	let nonRepoPath: string;

	beforeAll(() => {
		repoPath = path.join(os.tmpdir(), "ondesided-test-enrich-repo-" + Date.now());
		nonRepoPath = path.join(os.tmpdir(), "ondesided-test-enrich-nonrepo-" + Date.now());
		fs.mkdirSync(repoPath);
		fs.mkdirSync(nonRepoPath);
		execSync("git init", { cwd: repoPath });
	});

	afterAll(() => {
		fs.rmSync(repoPath, { recursive: true, force: true });
		fs.rmSync(nonRepoPath, { recursive: true, force: true });
	});

	it("sets isGitRepo to true for a git repo", () => {
		const project = makeProject("my-project", null, false);
		project.path = repoPath;
		const result = addGitInfoToProject(project);
		expect(result.isGitRepo).toBe(true);
		expect(result.git).not.toBeNull();
	});

	it("sets isGitRepo to false for a non-git directory", () => {
		const project = makeProject("not-a-repo", null, false);
		project.path = nonRepoPath;
		const result = addGitInfoToProject(project);
		expect(result.isGitRepo).toBe(false);
		expect(result.git).toBeNull();
	});
});
