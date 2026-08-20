import type { LocalizedString } from '@internationalized/string';
import { JSX } from 'react';
type PackageLocalizedStrings = {
    [packageName: string]: Record<string, LocalizedString>;
};
interface PackageLocalizationProviderProps {
    locale: string;
    strings: PackageLocalizedStrings;
    nonce?: string;
}
/**
 * A PackageLocalizationProvider can be rendered on the server to inject the localized strings
 * needed by the client into the initial HTML.
 */
export declare function PackageLocalizationProvider(props: PackageLocalizationProviderProps): JSX.Element | null;
/**
 * Returns the content for an inline `<script>` tag to inject localized strings into initial HTML.
 */
export declare function getPackageLocalizationScript(locale: string, strings: PackageLocalizedStrings): string;
export {};
