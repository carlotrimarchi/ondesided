#!/usr/bin/env node

import { program, Option } from "commander";
import Scanner from "./scanner.js";
import formatter from "./formatter.js";
import { addGitInfoToProject, parseSortOption, sortProjects } from "./projects.js";



program
	.name("ondesided")
	.description("A CLI to manage your side projects.")
	.version("0.1.0")
	.requiredOption("-d, --dir <path>", "Directory to scan")
	.addOption(
		new Option("-f, --format <type>", "Format output: pretty, tsv, json")
			.choices(["pretty", "tsv", "json"])
			.default("pretty"),
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
		new Option("--sort <type>", "Sort")
			.choices(["date", "date-asc", "name", "name-desc"])
			.default("date"),
	)
	.action((options) => {
		const scanner = new Scanner();
		const projectDirectories = scanner.scanFolder(options.dir);
		const projectsWithGitInfo = projectDirectories.map(addGitInfoToProject);

		const parsedSortOption = parseSortOption(options.sort);
		const sortedProjects = sortProjects(
			projectsWithGitInfo,
			parsedSortOption.by,
			parsedSortOption.order,
		);

		const output = formatter(
			sortedProjects,
			options.format,
			options.detail,
		);

		if (output) {
			console.log(output);
		}
	});

program.parse();
