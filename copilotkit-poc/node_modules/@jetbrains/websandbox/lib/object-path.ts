type AnyObject = any;

const PATH_REG = /([.[\]:;'"\s])/;

export function escapePathPart(pathPart: string): string {
  if (!PATH_REG.test(pathPart)) {
    return pathPart;
  }

  const escaped = pathPart.replace(new RegExp(PATH_REG.source, 'g'), '\\$1');
  return `["${escaped}"]`;
}

export function unescapePathPart(pathPart: string): string {
  return pathPart.replace(/^\["/, '').replace(/"]$/, '').replace(/\\/, '');
}

export function splitPath(path: string): string[] {
  const result: string[] = [];
  let lastEnd = 0;

  for (let i = 0; i < path.length; i++) {
    const char = path[i];
    if (PATH_REG.test(char) && path[i - 1] !== '\\') {
      result.push(path.substring(lastEnd, i));
      lastEnd = i + 1;
    }
  }
  result.push(path.substring(lastEnd, path.length));

  return result.filter(pathPart => !!pathPart).map(pathPart => pathPart.replace(/\\/g, ''));
}

/**
 * Extracts object property value by given path. Supports nested and array values: 'foo[0].bar'
 * @param {Object} object source object
 * @param {string} path path to value
 * @return {any | null} value by given path
 * */
export function propertyByPath<R extends AnyObject, O extends AnyObject = AnyObject>(
  object: O,
  path: string,
): R | null {
  return splitPath(path).reduce<R | null>(
    (acc, pathPart) => {
      if (acc) {
        return (acc as {[k: string]: R})[pathPart];
      }
      return null;
    },
    object as unknown as R,
  ) as R;
}
