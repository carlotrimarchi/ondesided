#!/usr/bin/env node

import { program, Option } from "commander";
import Scanner from "./scanner.js";
import formatter from "./formatter.js";
import getGitInfo from "./git.js";

program
	.name("ondesided")
	.description("A CLI to manage your side projects.")
	.version("0.1.0")
	.option("-d, --dir <path>", "Directory to scan")
	.addOption(
		new Option("-f, --format <type>", "Format output: path, tsv, json")
			.choices(["pretty", "tsv", "json"])
			.default("pretty"),
	)
	.addOption(
		new Option("--detail <level>", "Description...")
			.choices(["path-only", "minimal", "simple", "full"])
			.default("path-only"),
	)
	.action((options) => {
		const scanner = new Scanner();
		const projectDirectories = scanner.scanFolder(options.dir);
		const enrichedProjects = projectDirectories.map((project) => {
			const git = getGitInfo(project.path);
			project.isGitRepo = git !== null;
			project.git = git;
			return project;
		});

		// Sort priority:
		// 1) projects with a commit date come first.
		// 2) newer commit dates come before older ones.
		// 3) if both have no commits, sort by project name.
		enrichedProjects.sort((projA, projB) => {
			// this is mostly to shut TypeScript up
			// .git or date can't be missing at this point, but in case let's
			// set it to null
			const timeA = projA.git?.lastCommitDate?.getTime() ?? null;
			const timeB = projB.git?.lastCommitDate?.getTime() ?? null;

			// both have a date: descending order (most recent first).
			if (timeA !== null && timeB !== null) {
				return timeB - timeA;
				// only A has a date: A comes first
			} else if (timeA !== null) {
				return -1;
				// only B has a date: B comes first
			} else if (timeB !== null) {
				return 1;
			} else {
				// neither has a date: alphabetical fallback
				return projA.name.localeCompare(projB.name);
			}
		});
		const output = formatter(enrichedProjects, options.format, options.detail);

		if (output) {
			console.log(output);
		}
	});

program.parse();
