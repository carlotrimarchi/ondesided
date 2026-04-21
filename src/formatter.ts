import type { Project } from "./scanner.js";

type OutputFormat = "pretty" | "tsv" | "json";
type OutputDetail = "path-only" | "minimal" | "simple" | "full";
type PropValue = Date | string | boolean | null;

/**
 * A mapping of which property to display in the output
 * depending on the selected detail level
 */
const propsByDetail: Record<OutputDetail, string[]> = {
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

/**
 * Given a Project object and a property path, returns
 * the value of such property.
 * The property path can be an array or a string of dot separated
 * property names, indicating a top-level or nested path to follow.
 *
 * @param obj - Project object to read from
 * @param path - dot-notation or array path to the property
 * @returns the value of the property if it's a string, boolean or Date, null otherwise
 *
 * @example
 * pickPropValue(project, "git.lastCommitDate") // => Date | null
 * pickPropValue(project, ["git", "lastCommitDate"] // => Date | null
 * pickPropValue(project, "name")               // => string | null
 */

export function pickPropValue(
	obj: Project,
	path: string[] | string,
): PropValue {
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

/**
 * Given an object, a property path, and a value, modifies
 * the object in-place by setting the property at the given path
 * to the given value.
 *
 * The property path can be an array or a string of dot separated
 * property names, indicating a top-level or nested path to follow.
 *
 * @param targetObj - object on which to set the property
 * @param path - dot-notation or array path to the property
 * @param value - value to set the property to
 * @returns the modified object
 *
 * @example
 * setProp({}, "git.branch", "main") // => { git: { branch: "main" } }
 * setProp({}, ["git", "branch"], "main") // => { git: { branch: "main" } }
 * setProp({ name: "todo-app" }, "git.branch", "main") // => { name: "todo-app", git: { branch: "main" } }
 */
export function setProp(
	targetObj: Record<string, any>,
	path: string[] | string,
	value: PropValue,
): Record<string, any> {
	if (typeof path === "string") {
		path = path.split(".");
	}

	path.reduce((acc, current, i, array) => {
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

/**
 * Converts a Project into a plain output object containing
 * only the specified properties.
 *
 * @param project - the Project to convert
 * @param props - array of paths of the properties to include
 * @returns a plain object with only the selected properties
 */

export function projectToOutput(
	project: Project,
	props: string[],
): Record<string, PropValue> {
	const result = {};
	for (const prop of props) {
		const value = pickPropValue(project, prop);
		setProp(result, prop, value);
	}
	return result;
}

/** Formats a list of projects as tab-separated values.  */

export function formatAsTsv(projects: Project[], props: string[]): string {
	return projects
		.map((project) =>
			props.map((p) => pickPropValue(project, p) ?? "").join("\t"),
		)
		.join("\n");
}

/** Formats a list of projects as a JSON array. */

export function formatAsJson(projects: Project[], props: string[]): string {
	const output = projects.map((project) => projectToOutput(project, props));
	return JSON.stringify(output);
}

/**
 * Calculates the column width needed to align all values in
 * the pretty output.
 *
 * The "name" prop is not indented, so its label length is
 * used as-is.
 * All other props are indented, so indent length is added.
 */

export function getLabelPad(
	labels: Record<string, string>,
	props: string[],
	indent: string,
): number {
	const maxLabelWidth = Math.max(
		...props.map((p) => {
			const label = labels[p] ?? p;
			return p === "name" ? label.length : indent.length + label.length;
		}),
	);

  // +1 for the space after the colon
	return maxLabelWidth + 1;
}

export function formatDate(date: Date): string {
	return date.toLocaleString("en-GB", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	});
}

/** 
 * Formats a single label-value line for the pretty output, 
 * with optional indentation. 
 * 
 * The name label is not indented, so "indent" will be 
 * equal to "".
 */

export function formatPrettyOutputLine(
	label: string,
	value: string | boolean,
	labelPad: number,
	indent: string = "",
): string {
	return `${indent}${label}:${" ".repeat(labelPad - indent.length - label.length)}${value}`;
}

/** Formats a list of projects as a human-readable pretty-printed list. */

export function formatAsPretty(projects: Project[], props: string[]): string {
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
	const labelPad = getLabelPad(prettyLabels, props, indent);

	return projects
		.map((project, i) => {
			const projectCounter = `#${i + 1}`;
			let lines = [projectCounter];
			for (const prop of props) {
				let value = pickPropValue(project, prop);

				if (value instanceof Date) {
					value = formatDate(value);
				}

				if (value !== null && value !== "") {
					const label = prettyLabels[prop] ?? prop;
					const lineIndent = prop === "name" ? "" : indent;
					const outputLine = formatPrettyOutputLine(
						label,
						value,
						labelPad,
						lineIndent,
					);
					lines.push(outputLine);
				}
			}
			return `\n${lines.join("\n")}\n`;
		})
		.join("\n");
}

export default function formatter(
	projects: Project[],
	format: OutputFormat = "pretty",
	detail: OutputDetail = "path-only",
): string {
	const props = propsByDetail[detail];

	if (format === "tsv") {
		return formatAsTsv(projects, props);
	} else if (format === "json") {
		return formatAsJson(projects, props);
	} else if (format === "pretty") {
		return formatAsPretty(projects, props);
	} else {
		throw new Error(`Invalid format: ${format}. Use pretty, tsv, or json.`);
	}
}
