import fs, { Dirent } from "fs";
import path from "path";

class Scanner {
  constructor() {}

  scanFolder(folderPath: string): Dirent[] {
    const allDirectories = fs.readdirSync(folderPath, {
      withFileTypes: true,
    });

    const projectDirectories = allDirectories.filter((dir) => {
      if (!dir.isDirectory()) {
        return false;
      }

      const dirPath = this.getDirentFullPath(dir, folderPath);
      return fs.readdirSync(dirPath).includes(".git");
    });
    return projectDirectories;
  }

  /**
   * Get full path of a Dirent
   *
   * It handles Node v20 (where only path was available)
   * And Node 21+ (where path is now deprecated and parentPath is available)
   */
  private getDirentFullPath(dirent: Dirent, basePath: string): string {
    // parentPath is available in Node v21.5.0+
    // path is now deprecated
    if ("parentPath" in dirent && dirent.parentPath) {
      return path.join(dirent.parentPath as string, dirent.name);
    }

    // for Node v20 we use path
    if ("path" in dirent && dirent.path) {
      return path.join(dirent.path as string, dirent.name);
    }

    // Fallback: use the basePath passed to scanFolder
    return path.join(basePath, dirent.name);
  }
}

export default Scanner;
