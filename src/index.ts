import { program, Option } from "commander";
import Scanner from "./scanner.js";
import formatter from "./formatter.js";

program
  .name("ondesided")
  .description("A CLI to manage your side projects.")
  .version("0.1.0")
  .option("-d, --dir <path>", "Directory to scan")
  .addOption(
    new Option("-f, --format <type>", "Format output: path, tsv, json")
      .choices(["path", "tsv", "json"])
      .default("path"),
  )
  .action((options) => {
    const scanner = new Scanner();
    const projectDirectories = scanner.scanFolder(options.dir);

    const output = formatter(projectDirectories, options.format);

    if (output) {
      console.log(output);
    }
  });

program.parse();
