import { execSync } from "child_process";
import type { ExecSyncOptionsWithStringEncoding } from "child_process";

export interface GitInfo {
	isGitRepo: boolean;
	lastCommitDate: Date | null;
	lastCommitMessage: string | null;
	branch: string | null;
	isDirty: boolean | null;
}

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

export default function getGitInfo(path: string): GitInfo {
	if (!isGitRepo(path)) {
		return {
			isGitRepo: false,
			lastCommitDate: null,
			lastCommitMessage: null,
			branch: null,
			isDirty: null,
		};
	}

	const branch = getBranch(path);
	const { message, date } = getLastCommit(path);
	const isDirty = isRepoDirty(path);

	return {
		isGitRepo: true,
		lastCommitDate: date,
		lastCommitMessage: message,
		branch,
		isDirty,
	};
}

export function isGitRepo(path: string): boolean {
	const isInsideWorkTree = gitCommand(
		path,
		"git rev-parse --is-inside-work-tree",
	);
	return isInsideWorkTree === "true";
}

export function getBranch(path: string): string | null {
	const raw =
		gitCommand(path, "git branch --show-current") ??
		gitCommand(path, "git rev-parse --abbrev-ref HEAD");

	if (!raw || raw === "HEAD") {
		return null;
	}

	return raw;
}

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

export function isRepoDirty(path: string): boolean | null {
	const status = gitCommand(path, "git status --porcelain");
	return status !== null ? status !== "" : null;
}
