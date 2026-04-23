/**
 * Re-export the shared SafeHtml renderer and helper types for direct imports.
 */
export { default, sanitizeHtml } from './SafeHtml';
export type {
  SafeHtmlOptions,
  SafeHtmlProfile,
  SafeHtmlProps,
} from './SafeHtml';
