import fs from "node:fs";
import asyncFs from "node:fs/promises";
import path from "node:path";
export async function outputFile(filePath, fileContent) {
    try {
        await asyncFs.writeFile(filePath, fileContent);
    }
    catch (err) {
        if (err.code !== "ENOENT") {
            throw err;
        }
        await asyncFs.mkdir(path.dirname(filePath), { recursive: true });
        await asyncFs.writeFile(filePath, fileContent);
    }
}
export function outputFileSync(filePath, fileContent) {
    try {
        fs.writeFileSync(filePath, fileContent);
    }
    catch (err) {
        if (err.code !== "ENOENT") {
            throw err;
        }
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, fileContent);
    }
}
