import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import getGitInfo, {
	isGitRepo,
	getBranch,
	getLastCommit,
	isRepoDirty,
} from "../git.js";

describe("isGitRepo", () => {
	let testRepoPath: string;
	let testNonRepoPath: string;
	beforeAll(() => {
		testRepoPath = path.join(
			os.tmpdir(),
			"ondesided-test-repo" + Date.now(),
		);
		testNonRepoPath = path.join(
			os.tmpdir(),
			"ondesided-test-nonrepo" + Date.now(),
		);
		fs.mkdirSync(testRepoPath);
		fs.mkdirSync(testNonRepoPath);
		execSync("git init", { cwd: testRepoPath });
	});
	afterAll(() => {
		fs.rmSync(testRepoPath, { recursive: true, force: true });
		fs.rmSync(testNonRepoPath, { recursive: true, force: true });
	});
	it("returns true for a git repository path", () => {
		expect(isGitRepo(testRepoPath)).toBe(true);
	});
	it("returns false for an existing non-git directory", () => {
		expect(isGitRepo(testNonRepoPath)).toBe(false);
	});
	it("returns false for a path that does not exist", () => {
		const missingPath = path.join(
			os.tmpdir(),
			"ondesided-missing-" + Date.now(),
		);
		expect(isGitRepo(missingPath)).toBe(false);
	});
});

describe("getBranch", () => {
	let testRepoPath: string;
	let testNonRepoPath: string;
	beforeAll(() => {
		testRepoPath = path.join(
			os.tmpdir(),
			"ondesided-test-repo" + Date.now(),
		);
		testNonRepoPath = path.join(
			os.tmpdir(),
			"ondesided-test-nonrepo" + Date.now(),
		);
		fs.mkdirSync(testRepoPath);
		fs.mkdirSync(testNonRepoPath);
		execSync("git init", { cwd: testRepoPath });
		execSync("git switch -c test-branch", { cwd: testRepoPath });
	});

	afterAll(() => {
		fs.rmSync(testRepoPath, { recursive: true, force: true });
		fs.rmSync(testNonRepoPath, { recursive: true, force: true });
	});

	it("returns the active branch name in a git repository", () => {
		expect(getBranch(testRepoPath)).toBe("test-branch");
	});

	it("returns null for an existing non-git directory", () => {
		expect(getBranch(testNonRepoPath)).toBe(null);
	});

	it("returns null in a non-existing directory", () => {
		const missingPath = path.join(
			os.tmpdir(),
			"ondesided-missing" + Date.now(),
		);
		expect(getBranch(missingPath)).toBe(null);
	});

	it("returns null when repository is in detached HEAD state", () => {
		fs.writeFileSync(path.join(testRepoPath, "README.md"), "hello");
		execSync("git add .", { cwd: testRepoPath });
		execSync(
			'git -c user.name="Test" -c user.email="test@test.com" commit -m "init"',
			{
				cwd: testRepoPath,
			},
		);

		const commitHash = execSync("git rev-parse HEAD", {
			cwd: testRepoPath,
			encoding: "utf-8",
		}).trim();
		execSync(`git checkout ${commitHash}`, { cwd: testRepoPath });

		expect(getBranch(testRepoPath)).toBeNull();
	});
});

describe("getLastCommit", () => {
	let testRepoPath: string;
	let testNonRepoPath: string;
	beforeAll(() => {
		testRepoPath = path.join(
			os.tmpdir(),
			"ondesided-test-repo" + Date.now(),
		);
		testNonRepoPath = path.join(
			os.tmpdir(),
			"ondesided-test-nonrepo" + Date.now(),
		);
		fs.mkdirSync(testRepoPath);
		fs.mkdirSync(testNonRepoPath);
		execSync("git init", { cwd: testRepoPath });

		fs.writeFileSync(path.join(testRepoPath, "README.md"), "hello");

		execSync("git add .", { cwd: testRepoPath });

		execSync(
			'git -c user.name="Test" -c user.email="test@test.com" commit -m "init"',
			{
				cwd: testRepoPath,
			},
		);
	});

	it("returns an object containing message and date properties", () => {
		expect(getLastCommit(testRepoPath)).toHaveProperty("message");
		expect(getLastCommit(testRepoPath)).toHaveProperty("date");

		const { date } = getLastCommit(testRepoPath);
		expect(date).not.toBeNull();
		expect(date).toBeInstanceOf(Date);
		expect(Number.isNaN((date as Date).getTime())).toBe(false);
	});

	it("returns null message and date for an existing non-git directory", () => {
		expect(getLastCommit(testNonRepoPath)).toEqual({
			message: null,
			date: null,
		});
	});

	it("returns null message and date for git repo with no commits", () => {
		const repoNoCommits = path.join(
			os.tmpdir(),
			"ondesided-test-repo-no-commits" + Date.now(),
		);
		fs.mkdirSync(repoNoCommits);
		execSync("git init", { cwd: repoNoCommits });

		expect(getLastCommit(repoNoCommits)).toEqual({
			message: null,
			date: null,
		});
	});

	it("keeps commit messages with spaces and special characters", () => {
		const repoPath = path.join(
			os.tmpdir(),
			"ondesided-special-msg-" + Date.now(),
		);

		try {
			fs.mkdirSync(repoPath);
			execSync("git init", { cwd: repoPath });

			fs.writeFileSync(path.join(repoPath, "README.md"), "hello");
			execSync("git add .", { cwd: repoPath });

			const message =
				"feat(core): handle spaces, commas, [brackets], and #hash";
			execSync(
				`git -c user.name="Test" -c user.email="test@test.com" commit -m "${message}"`,
				{ cwd: repoPath },
			);

			const result = getLastCommit(repoPath);

			expect(result.message).toBe(message);
			expect(result.date).not.toBeNull();
			expect(result.date).toBeInstanceOf(Date);
		} finally {
			fs.rmSync(repoPath, { recursive: true, force: true });
		}
	});

	it("works also with empty commit messages", () => {
		const repoPath = path.join(
			os.tmpdir(),
			"ondesided-empty-msg-" + Date.now(),
		);

		try {
			fs.mkdirSync(repoPath);
			execSync("git init", { cwd: repoPath });

			fs.writeFileSync(path.join(repoPath, "README.md"), "hello");
			execSync("git add .", { cwd: repoPath });

			const message = "";
			execSync(
				`git -c user.name="Test" -c user.email="test@test.com" commit  --allow-empty-message -m "${message}"`,
				{ cwd: repoPath },
			);

			const result = getLastCommit(repoPath);

			expect(result.message).toBe(message);
			expect(result.date).not.toBeNull();
			expect(result.date).toBeInstanceOf(Date);
		} finally {
			fs.rmSync(repoPath, { recursive: true, force: true });
		}
	});
});

describe("isRepoDirty", () => {
	let dirtyRepoPath: string;
	let cleanRepoPath: string;
	let nonRepoPath: string;
	beforeAll(() => {
		dirtyRepoPath = path.join(
			os.tmpdir(),
			"ondesided-test-dirty-repo-" + Date.now(),
		);
		cleanRepoPath = path.join(
			os.tmpdir(),
			"ondesided-test-clean-repo-" + Date.now(),
		);
		nonRepoPath = path.join(
			os.tmpdir(),
			"ondesided-test-nonrepo-dirty-" + Date.now(),
		);

		fs.mkdirSync(dirtyRepoPath);
		fs.mkdirSync(cleanRepoPath);
		fs.mkdirSync(nonRepoPath);
		execSync("git init", { cwd: dirtyRepoPath });
		execSync("git init", { cwd: cleanRepoPath });

		fs.writeFileSync(path.join(dirtyRepoPath, "README.md"), "hello");
	});
	afterAll(() => {
		fs.rmSync(dirtyRepoPath, { recursive: true, force: true });
		fs.rmSync(cleanRepoPath, { recursive: true, force: true });
		fs.rmSync(nonRepoPath, { recursive: true, force: true });
	});

	it("returns true for a repository with uncommitted changes", () => {
		expect(isRepoDirty(dirtyRepoPath)).toBe(true);
	});
	it("returns false for a clean repository", () => {
		expect(isRepoDirty(cleanRepoPath)).toBe(false);
	});
	it("returns null for an existing non-git directory", () => {
		expect(isRepoDirty(nonRepoPath)).toBe(null);
	});
	it("returns null for a path that does not exist", () => {
		const missingPath = path.join(
			os.tmpdir(),
			"ondesided-missing-dirty-" + Date.now(),
		);

		expect(isRepoDirty(missingPath)).toBe(null);
	});
});

describe("getGitInfo", () => {
	it("returns complete git info for a clean repository with a commit", () => {
		const repoPath = path.join(
			os.tmpdir(),
			"ondesided-git-info-clean-" + Date.now(),
		);

		try {
			fs.mkdirSync(repoPath);
			execSync("git init", { cwd: repoPath });
			execSync("git switch -c test-branch", { cwd: repoPath });
			fs.writeFileSync(path.join(repoPath, "README.md"), "hello");
			execSync("git add .", { cwd: repoPath });
			execSync(
				'git -c user.name="Test" -c user.email="test@test.com" commit -m "init"',
				{ cwd: repoPath },
			);

			const info = getGitInfo(repoPath);

			expect(info.isGitRepo).toBe(true);
			expect(info.branch).toBe("test-branch");
			expect(info.lastCommitMessage).toBe("init");
			expect(info.lastCommitDate).toBeInstanceOf(Date);
			expect(info.isDirty).toBe(false);
		} finally {
			fs.rmSync(repoPath, { recursive: true, force: true });
		}
	});

	it("returns dirty state for a repository with uncommitted changes", () => {
		const repoPath = path.join(
			os.tmpdir(),
			"ondesided-git-info-dirty-" + Date.now(),
		);

		try {
			fs.mkdirSync(repoPath);
			execSync("git init", { cwd: repoPath });
			execSync("git switch -c test-branch", { cwd: repoPath });
			fs.writeFileSync(path.join(repoPath, "README.md"), "hello");
			execSync("git add .", { cwd: repoPath });
			execSync(
				'git -c user.name="Test" -c user.email="test@test.com" commit -m "init"',
				{ cwd: repoPath },
			);
			fs.writeFileSync(path.join(repoPath, "README.md"), "changed");

			const info = getGitInfo(repoPath);

			expect(info.isGitRepo).toBe(true);
			expect(info.branch).toBe("test-branch");
			expect(info.lastCommitMessage).toBe("init");
			expect(info.lastCommitDate).toBeInstanceOf(Date);
			expect(info.isDirty).toBe(true);
		} finally {
			fs.rmSync(repoPath, { recursive: true, force: true });
		}
	});

	it("returns null commit info for a repository without commits", () => {
		const repoPath = path.join(
			os.tmpdir(),
			"ondesided-git-info-no-commits-" + Date.now(),
		);

		try {
			fs.mkdirSync(repoPath);
			execSync("git init", { cwd: repoPath });
			execSync("git switch -c test-branch", { cwd: repoPath });

			const info = getGitInfo(repoPath);

			expect(info.isGitRepo).toBe(true);
			expect(info.branch).toBe("test-branch");
			expect(info.lastCommitMessage).toBeNull();
			expect(info.lastCommitDate).toBeNull();
			expect(info.isDirty).toBe(false);
		} finally {
			fs.rmSync(repoPath, { recursive: true, force: true });
		}
	});

	it("returns null git fields for an existing non-git directory", () => {
		const nonRepoPath = path.join(
			os.tmpdir(),
			"ondesided-git-info-nonrepo-" + Date.now(),
		);

		try {
			fs.mkdirSync(nonRepoPath);

			expect(getGitInfo(nonRepoPath)).toEqual({
				isGitRepo: false,
				branch: null,
				lastCommitMessage: null,
				lastCommitDate: null,
				isDirty: null,
			});
		} finally {
			fs.rmSync(nonRepoPath, { recursive: true, force: true });
		}
	});

	it("returns null git fields for a path that does not exist", () => {
		const missingPath = path.join(
			os.tmpdir(),
			"ondesided-git-info-missing-" + Date.now(),
		);

		expect(getGitInfo(missingPath)).toEqual({
			isGitRepo: false,
			branch: null,
			lastCommitMessage: null,
			lastCommitDate: null,
			isDirty: null,
		});
	});
});
