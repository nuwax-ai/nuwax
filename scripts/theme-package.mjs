#!/usr/bin/env node
import { constants } from 'node:fs';
import { lstat, mkdir, open, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  canonicalPath,
  deepSeekThemePackage,
  limits,
  officialThemePackage,
  validateThemePackage,
} from '../src/features/themes/core/index.mjs';

async function readDirectory(dir) {
  const files = {};
  let total = 0,
    count = 0;
  async function walk(full, relative = '', depth = 0) {
    if (depth > 32) throw new Error(`${relative}: directory depth limit`);
    const stat = await lstat(full);
    if (stat.isSymbolicLink() || !stat.isDirectory())
      throw new Error(
        `${relative || dir}: expected directory, symlinks forbidden`,
      );
    const entries = await readdir(full, { withFileTypes: true });
    // Bound entries, including directories, before recursing.
    count += entries.length;
    if (count > limits.files) throw new Error('directory: 500 entry limit');
    for (const entry of entries) {
      const rel = relative ? `${relative}/${entry.name}` : entry.name;
      canonicalPath(rel);
      const abs = path.join(full, entry.name),
        s = await lstat(abs);
      if (s.isSymbolicLink()) throw new Error(`${rel}: symlinks forbidden`);
      if (s.isDirectory()) {
        await walk(abs, rel, depth + 1);
        continue;
      }
      if (!s.isFile() || s.size > limits.fileBytes)
        throw new Error(`${rel}: invalid file or 5 MiB limit`);
      // NOFOLLOW plus inode comparison prevents replacing the leaf with a link.
      const handle = await open(abs, constants.O_RDONLY | constants.O_NOFOLLOW);
      try {
        const opened = await handle.stat();
        if (!opened.isFile() || opened.ino !== s.ino || opened.dev !== s.dev)
          throw new Error(`${rel}: changed during read`);
        const data = Buffer.alloc(Math.min(limits.fileBytes + 1, s.size + 1));
        let length = 0;
        while (length < data.length) {
          const { bytesRead } = await handle.read(
            data,
            length,
            data.length - length,
            null,
          );
          if (!bytesRead) break;
          length += bytesRead;
        }
        if (length !== s.size || length > limits.fileBytes)
          throw new Error(`${rel}: changed/oversized file`);
        total += length;
        if (total > limits.totalBytes)
          throw new Error('directory: 20 MiB total limit');
        files[rel] = data.subarray(0, length).toString('base64');
      } finally {
        await handle.close();
      }
    }
  }
  await walk(dir);
  return files;
}
async function main() {
  const [command, dir, example, ...extra] = process.argv.slice(2);
  if (
    !dir ||
    extra.length ||
    !['validate', 'template'].includes(command) ||
    (command === 'validate' && example) ||
    (example && !['official', 'deepseek'].includes(example))
  )
    throw new Error(
      'Usage: node scripts/theme-package.mjs validate <directory> | template <new-directory> [official|deepseek]',
    );
  if (command === 'validate') {
    const pkg = validateThemePackage(await readDirectory(dir));
    console.log(
      `Valid: ${pkg.manifest.id} (${Object.keys(pkg.manifest.variants).join(
        ', ',
      )})`,
    );
  } else {
    const pkg =
      example === 'deepseek' ? deepSeekThemePackage : officialThemePackage;
    const files = {
      ...pkg.files,
      'theme.json': Buffer.from(
        JSON.stringify(
          {
            ...pkg.manifest,
            id: 'my-theme',
            name: 'My Theme',
          },
          null,
          2,
        ),
      ).toString('base64'),
    };
    await mkdir(dir); // Existing destination is deliberately never overwritten.
    for (const [name, b64] of Object.entries(files)) {
      const dest = path.join(dir, name);
      if (path.dirname(name) !== '.')
        await mkdir(path.dirname(dest), { recursive: true });
      await writeFile(dest, Buffer.from(b64, 'base64'), { flag: 'wx' });
    }
    console.log(`Template: ${dir}`);
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
