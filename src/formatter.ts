import { Dirent } from "fs";
import type { Project } from "./scanner.js";

type OutputFormat = "path" | "tsv" | "json";

export default function formatter(
	projects: Project[],
	format: OutputFormat = "path",
): string {
	if (format === "tsv") {
		return projects
			.map((project) => `${project.name}\t${project.path}`)
			.join("\n");
	} else if (format === "json") {
		const output = projects.map((project) => {
			return {
				name: project.name,
				path: project.path,
			};
		});
		return JSON.stringify(output);
	} else if (format === "path") {
		return projects.map((project) => project.path).join("\n");
	} else {
		throw new Error(`Invalid format: ${format}. Use path, tsv, or json.`);
	}
}
