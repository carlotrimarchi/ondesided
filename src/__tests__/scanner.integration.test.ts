import { describe, expect, it, beforeEach, vi } from "vitest";
import { vol } from "memfs";
import Scanner from "../scanner.js";

vi.mock("fs", async () => {
  const memfs = await import("memfs");
  return { default: memfs.fs };
});

describe("Scanner integration tests", () => {
  beforeEach(() => vol.reset());
  it("returns real Dirent objects with filesystem properties", () => {
    vol.fromJSON(
      {
        "project1/.git/config": "",
        "project2/.git/config": "",
      },
      "/projects",
    );

    const scanner = new Scanner();
    const result = scanner.scanFolder("/projects");

    expect(result).toHaveLength(2);
    if (!result[0]) {
      throw new Error("Expected project to exist");
    }

    expect(result[0]).toHaveProperty("name");
    expect(result[0]).toHaveProperty("path");
  });
});
