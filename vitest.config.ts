import { defineConfig } from "vitest/config";

export default defineConfig({
	clearScreen: false,
	test: {
		include: ["src/**/*.test.ts"],
		exclude: ["dist", "node_modules"],
		reporters: ["tree"],
	},
});
