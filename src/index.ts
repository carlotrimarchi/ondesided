import { program } from "commander";

program
  .name("ondesided")
  .description("A CLI to manage your side projects.")
  .version("0.1.0")
  .action(() => console.log("it works"));

// program.command("ondesided").action(() => console.log("Hey"));

program.parse();
