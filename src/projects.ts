import getGitInfo from "./git.js";
import type { Project } from "./scanner.js";

type SortBy = "name" | "date";
type SortOrder = "asc" | "desc";
type SortOptions = {
	by: SortBy;
	order: SortOrder;
};

/** Fetches and attaches git information to a project. */

export function addGitInfoToProject(project: Project): Project {
	const git = getGitInfo(project.path);
	project.isGitRepo = git !== null;
	project.git = git;
	return project;
}

export function parseSortOption(sortOption: string): SortOptions {
	const sortOptions: Record<string, SortOptions> = {
		date: { by: "date", order: "desc" }, // Most recent first (on top)
		"date-asc": { by: "date", order: "asc" }, // Oldest first (on top)
		name: { by: "name", order: "asc" }, // A to Z
		"name-desc": { by: "name", order: "desc" }, // Z to A
	};
	return sortOptions[sortOption] ?? { by: "date", order: "desc" };
}

/**
 * Sorts projects in-place by the given field and order.
 * When sorting by date, projects without commits come last,
 * sorted alphabetically.
 */

export function sortProjects(
	projects: Project[],
	by: SortBy = "date",
	order: SortOrder = "desc",
): Project[] {
	const direction = order === "desc" ? 1 : -1;

	if (by === "name") {
		projects.sort((a, b) => a.name.localeCompare(b.name) * -direction);
	} else {
		// Sort priority:
		// 1) projects with a commit date come first.
		// 2) newer commit dates come before older ones.
		// 3) if both have no commits, sort by project name.
		projects.sort((projA, projB) => {
			// this is mostly to shut TypeScript up
			// .git or date can't be missing at this point, but in case let's
			// set it to null
			const timeA = projA.git?.lastCommitDate?.getTime() ?? null;
			const timeB = projB.git?.lastCommitDate?.getTime() ?? null;

			// both have a date: sort by date according to direction
			if (timeA !== null && timeB !== null) {
				return (timeB - timeA) * direction;
				// only A has a date: A comes first (regardless of direction)
			} else if (timeA !== null) {
				return -direction;
				// only B has a date: B comes first (regardless of direction)
			} else if (timeB !== null) {
				return direction;
			} else {
				// neither has a date: alphabetical fallback
				return projA.name.localeCompare(projB.name);
			}
		});
	}

	return projects;
}
