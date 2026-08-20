const stripTrailingSlash = (str: string) => str.replace(/\/$/, '')

/**
 *
 * @param host e.g. "http://foo.com"
 * @param path e.g. "/bar"
 * @returns "e.g." "http://foo.com/bar"
 */
export const tryCreateFormattedUrl = (host: string, path?: string) => {
  return stripTrailingSlash(new URL(path || '', host).href)
}
