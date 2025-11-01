import { program } from "commander";
import Scanner from "./scanner.js";

program
  .name("ondesided")
  .description("A CLI to manage your side projects.")
  .version("0.1.0")
  .option("-d, --dir <path>", "Directory to scan")
  .action((options) => {
    const scanner = new Scanner();
    const projectDirectories = scanner.scanFolder(options.dir);
    console.log(projectDirectories);
  });

program.parse();
