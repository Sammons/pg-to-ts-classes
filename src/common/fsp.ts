import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';

async function ensureDir(p: string) {
  p = path.resolve(p);
  const alreadyExists = await fsp.exists(p);
  if (alreadyExists) {
    const stats = await fsp.stat(p);
    if (!stats.isDirectory()) {
      throw new Error(
        `Cannot proceed, something non-directory already exists at ${p}`
      );
    }
  } else {
    // TODO fix possibility of race
    const pathSegments = p.split(path.sep).filter(s => s.length);
    const base = (path.sep + pathSegments.shift()) as string;
    const baseExists = await fsp.exists(base);
    if (!baseExists) {
      throw new Error(
        `Cannot recursively create directory inside path: ${base}`
      );
    }
    let constructedPath = base;
    for (const segment of pathSegments) {
      constructedPath += path.sep + segment;
      const segmentSoFarExists = await fsp.exists(constructedPath);
      if (segmentSoFarExists) {
        const stats = await fsp.stat(constructedPath);
        if (!stats.isDirectory()) {
          throw new Error(
            `Path ${constructedPath} is not a directory, cannot make more directories inside of it.`
          );
        }
      } else {
        try {
          await fsp.mkdir(constructedPath);
        } catch (err) {
          if (await fsp.exists(constructedPath)) {
            console.log(
              'Failed to create',
              constructedPath,
              'looks like this was a race with someone else'
            );
          } else {
            throw err;
          }
        }
      }
    }
  }
}
// to avoid warnings about experimental api
export const fsp = {
  exists: util.promisify(fs.exists),
  readdir: util.promisify(fs.readdir),
  readFile: util.promisify(fs.readFile),
  stat: util.promisify(fs.stat),
  writeFile: util.promisify(fs.writeFile),
  mkdir: util.promisify(fs.mkdir),
  ensureDir,
};