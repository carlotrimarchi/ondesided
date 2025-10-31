import fs, { Dirent } from "fs";

class Scanner {
  constructor() {}

  scanFolder(path: string): Dirent[] {
    const allDirectories = fs.readdirSync(path, {
      withFileTypes: true,
    });
    const projectDirectories = allDirectories.filter((dir) => {
      if (!dir.isDirectory()) {
        return false;
      }

      return fs.readdirSync(`${path}/${dir.name}`).includes(".git");
    });
    return projectDirectories;
  }
}

export default Scanner;
