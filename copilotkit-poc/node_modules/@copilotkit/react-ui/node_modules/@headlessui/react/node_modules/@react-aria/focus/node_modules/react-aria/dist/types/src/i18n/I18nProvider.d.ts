import { Direction } from '@react-types/shared';
import { JSX, ReactNode } from 'react';
export interface Locale {
    /** The [BCP47](https://www.ietf.org/rfc/bcp/bcp47.txt) language code for the locale. */
    locale: string;
    /** The writing direction for the locale. */
    direction: Direction;
}
export interface I18nProviderProps {
    /** Contents that should have the locale applied. */
    children: ReactNode;
    /** The locale to apply to the children. */
    locale?: string;
}
/**
 * Provides the locale for the application to all child components.
 */
export declare function I18nProvider(props: I18nProviderProps): JSX.Element;
/**
 * Returns the current locale and layout direction.
 */
export declare function useLocale(): Locale;
