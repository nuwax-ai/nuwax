/** Reset the cached nonce value. Exported for testing only. */
export declare function resetNonceCache(): void;
/**
 * Returns the CSP nonce, if configured via a `<meta property="csp-nonce">` tag or
 * `__webpack_nonce__`. This allows dynamically injected `<style>` elements to work with Content
 * Security Policy.
 */
export declare function getNonce(doc?: Document): string | undefined;
