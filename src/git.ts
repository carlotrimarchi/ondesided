import { execSync } from "child_process";
import type { ExecSyncOptionsWithStringEncoding } from "child_process";

export interface GitInfo {
	lastCommitDate: Date | null;
	lastCommitMessage: string | null;
	branch: string | null;
	isDirty: boolean | null;
}

/**
 * Runs a git command in the given directory and returns the 
 * trimmed output, stripping trailing newlines (\n or \r\n).
 * 
 * Returns null if the command fails (e.g. not a git repo, no commits).
 */

const gitCommand = (path: string, command: string): string | null => {
	const execSyncOption: ExecSyncOptionsWithStringEncoding = {
		cwd: path,
		encoding: "utf-8",
		stdio: ["ignore", "pipe", "ignore"],
	};
	try {
		let output = execSync(command, execSyncOption);
		if (output.endsWith("\r\n")) {
			output = output.slice(0, -2);
		} else if (output.endsWith("\n")) {
			output = output.slice(0, -1);
		}
		return output;
	} catch {
		return null;
	}
};

/**
 * Returns git information for the given directory,
 * or null if it is not a git repository.
 */
export default function getGitInfo(path: string): GitInfo | null {
	if (!isGitRepo(path)) return null;

	const branch = getBranch(path);
	const { message, date } = getLastCommit(path);
	const isDirty = isRepoDirty(path);

	return {
		lastCommitDate: date,
		lastCommitMessage: message,
		branch,
		isDirty,
	};
}

/** Returns true if the given path is inside a git work tree. */
export function isGitRepo(path: string): boolean {
	const isInsideWorkTree = gitCommand(
		path,
		"git rev-parse --is-inside-work-tree",
	);
	return isInsideWorkTree === "true";
}

/** 
 * Returns the current branch name, or null if in 
 * detached HEAD state or not a git repo. 
 */
export function getBranch(path: string): string | null {
	const raw =
		gitCommand(path, "git branch --show-current") ??
		gitCommand(path, "git rev-parse --abbrev-ref HEAD");

	if (!raw || raw === "HEAD") {
		return null;
	}

	return raw;
}

/**
 * Returns the message and date of the last commit.
 * Uses a null byte (\x00) as separator in the git format string
 * to safely split message and date without conflicts with 
 * special characters.
 */
export function getLastCommit(path: string): {
	message: string | null;
	date: Date | null;
} {
	const lastCommit = gitCommand(path, "git show -s --format=%s%x00%ci");
	if (!lastCommit) {
		return { message: null, date: null };
	}
	const [message = null, date = null] = lastCommit.split("\0");
	const parsedDate = date ? new Date(date) : null;
	const safeDate =
		parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : null;

	return {
		message,
		date: safeDate,
	};
}

/** Returns true if the repo has uncommitted changes, 
 * false if clean, null if not a git repo. 
 */

export function isRepoDirty(path: string): boolean | null {
	const status = gitCommand(path, "git status --porcelain");
	return status !== null ? status !== "" : null;
}
