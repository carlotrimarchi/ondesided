import type { Project } from "./scanner.js";

type OutputFormat = "pretty" | "tsv" | "json";
type OutputDetail = "path-only" | "minimal" | "simple" | "full";

export function pickPropValue(
	obj: Project,
	path: string[] | string,
): Date | string | boolean | null {
	if (typeof path === "string") {
		path = path.split(".");
	}
	const result = path.reduce((acc, key) => {
		return acc && key in acc ? (acc as any)[key] : null;
	}, obj);
	return result instanceof Date ||
		typeof result === "string" ||
		typeof result === "boolean"
		? result
		: null;
}

export function setProp(
	targetObj: Record<string, any>,
	props: string[] | string,
	value: Date | string | number | boolean | null,
): Record<string, any> {
	if (typeof props === "string") {
		props = props.split(".");
	}

	props.reduce((acc, current, i, array) => {
		if (i === array.length - 1) {
			acc[current] = value;
			return acc;
		}
		if (current in acc && acc[current] !== null) {
			return acc[current];
		} else {
			acc[current] = {};
			return acc[current];
		}
	}, targetObj);

	return targetObj;
}

export default function formatter(
	projects: Project[],
	format: OutputFormat = "pretty",
	detail: OutputDetail = "path-only",
): string {
	const detailProps: Record<OutputDetail, string[]> = {
		"path-only": ["path"],
		minimal: ["name", "path"],
		simple: ["name", "path", "isGitRepo", "git.lastCommitDate"],
		full: [
			"name",
			"path",
			"isGitRepo",
			"git.branch",
			"git.isDirty",
			"git.lastCommitMessage",
			"git.lastCommitDate",
		],
	};

	if (format === "tsv") {
		const props = detailProps[detail];
		return projects
			.map((project) => props.map(p => pickPropValue(project, p) ?? "").join("\t"))
			.join("\n");
	} else if (format === "json") {
		const props = detailProps[detail];
		const output = projects.map((project) => {
			const result = {};
			for (const prop of props) {
				const value = pickPropValue(project, prop);
				setProp(result, prop, value);
			}
			return result;
		});
		return JSON.stringify(output);
	} else if (format === "pretty") {
		const props = detailProps[detail];
		const prettyLabels: Record<string, string> = {
			name: "Project",
			path: "Path",
			isGitRepo: "Git repo",
			"git.branch": "Current active branch",
			"git.isDirty": "Dirty",
			"git.lastCommitMessage": "Last commit",
			"git.lastCommitDate": "Last commit date",
		};
		const indent = "  ";
		const labelPad = Math.max(
			...props.map(p => {
				const label = prettyLabels[p] ?? p;
				return p === "name" ? label.length : indent.length + label.length;
			}),
		) + 1;
		return projects.map((project, i) => {
		const projectCounter = `#${i + 1}`;
			let lines = [projectCounter];
			for (const prop of props) {
				let value = pickPropValue(project, prop);
				if (value instanceof Date) {
					value = value.toLocaleString("en-GB", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
				}
				if (value !== null && value !== "") {
					const label = prettyLabels[prop] ?? prop;
					if (prop === "name") {
						lines.push(`${label}:${" ".repeat(labelPad - label.length)}${value}`);
					} else {
						lines.push(`${indent}${label}:${" ".repeat(labelPad - indent.length - label.length)}${value}`);
					}
				}
			}
			return `\n${lines.join("\n")}\n`;
		}).join("\n");
	} else {
		throw new Error(`Invalid format: ${format}. Use path, tsv, or json.`);
	}
}
