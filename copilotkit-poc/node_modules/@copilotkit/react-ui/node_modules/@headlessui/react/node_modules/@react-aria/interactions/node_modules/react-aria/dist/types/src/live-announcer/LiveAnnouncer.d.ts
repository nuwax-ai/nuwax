type Assertiveness = 'assertive' | 'polite';
type Message = string | {
    'aria-labelledby': string;
};
/**
 * Announces the message using screen reader technology.
 */
export declare function announce(message: Message, assertiveness?: Assertiveness, timeout?: number): void;
/**
 * Stops all queued announcements.
 */
export declare function clearAnnouncer(assertiveness: Assertiveness): void;
/**
 * Removes the announcer from the DOM.
 */
export declare function destroyAnnouncer(): void;
export {};
