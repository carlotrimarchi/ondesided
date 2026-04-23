#!/usr/bin/env node

import { fs } from "memfs";

import { program, Option } from "commander";
import Scanner from "./scanner.js";
import formatter from "./formatter.js";
import {
	addGitInfoToProject,
	parseSortOption,
	sortProjects,
} from "./projects.js";

program
	.name("ondesided")
	.description("A CLI to manage your side projects.")
	.version("0.1.0")
	.requiredOption("-d, --dir <path>", "Directory to scan")
	.addOption(
		new Option("-f, --format <type>", "Format output: pretty, tsv, json")
			.choices(["pretty", "tsv", "json"])
			.default("tsv"),
	)
	.addOption(
		new Option(
			"--detail <level>",
			"Determines which properties will be included in the output.",
		)
			.choices(["path-only", "minimal", "simple", "full"])
			.default("path-only"),
	)
	.addOption(
		new Option("--sort <mode>", "Sort results by date or name")
			.choices(["date", "date-asc", "name", "name-desc"])
			.default("date"),
	)
	.addOption(
		new Option("--limit <number>", "Limit the number of results").argParser(
			(value) => {
				const parsed = parseInt(value);
				if (isNaN(parsed) || parsed < 1) {
					throw new Error("--limit must be a positive integer");
				}
				return parsed;
			},
		),
	)
	.action((options) => {
		try {
			const scanner = new Scanner();
			const projectDirectories = scanner.scanFolder(options.dir);
			const projectsWithGitInfo =
				projectDirectories.map(addGitInfoToProject);

			const parsedSortOption = parseSortOption(options.sort);
			const sortedProjects = sortProjects(
				projectsWithGitInfo,
				parsedSortOption.by,
				parsedSortOption.order,
			);

			const limitedProjects = options.limit
				? sortedProjects.slice(0, parseInt(options.limit))
				: sortedProjects;

			const output = formatter(
				limitedProjects,
				options.format,
				options.detail,
			);

			if (output) {
				console.log(output);
			}
		} catch (err) {
			if (
				err instanceof Error &&
				"code" in err &&
				err.code === "ENOENT"
			) {
				console.error(`Error: directory not found: ${options.dir}`);
			} else if (
				err instanceof Error &&
				"code" in err &&
				err.code === "EACCES"
			) {
				console.error(`Error: permission denied: ${options.dir}`);
			} else {
				console.error(err);
				console.error(
					`An unexpected error occurred. Please report it at https://github.com/carlotrimarchi/ondesided/issues`,
				);
			}
			process.exit(1);
		}
	});

try {
	program.parse();
} catch (err) {
	if (err instanceof Error) {
		console.error(`Error: ${err.message}`);
	}
	process.exit(1);
}
