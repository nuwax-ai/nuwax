/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ const $a9f502cbcdb3951f$var$localeSymbol = Symbol.for('react-aria.i18n.locale');
const $a9f502cbcdb3951f$var$stringsSymbol = Symbol.for('react-aria.i18n.strings');
let $a9f502cbcdb3951f$var$cachedGlobalStrings = undefined;
class $a9f502cbcdb3951f$export$c17fa47878dc55b6 {
    /** Returns a localized string for the given key and locale. */ getStringForLocale(key, locale) {
        let strings = this.getStringsForLocale(locale);
        let string = strings[key];
        if (!string) throw new Error(`Could not find intl message ${key} in ${locale} locale`);
        return string;
    }
    /** Returns all localized strings for the given locale. */ getStringsForLocale(locale) {
        let strings = this.strings[locale];
        if (!strings) {
            strings = $a9f502cbcdb3951f$var$getStringsForLocale(locale, this.strings, this.defaultLocale);
            this.strings[locale] = strings;
        }
        return strings;
    }
    static getGlobalDictionaryForPackage(packageName) {
        if (typeof window === 'undefined') return null;
        let locale = window[$a9f502cbcdb3951f$var$localeSymbol];
        if ($a9f502cbcdb3951f$var$cachedGlobalStrings === undefined) {
            let globalStrings = window[$a9f502cbcdb3951f$var$stringsSymbol];
            if (!globalStrings) return null;
            $a9f502cbcdb3951f$var$cachedGlobalStrings = {};
            for(let pkg in globalStrings)$a9f502cbcdb3951f$var$cachedGlobalStrings[pkg] = new $a9f502cbcdb3951f$export$c17fa47878dc55b6({
                [locale]: globalStrings[pkg]
            }, locale);
        }
        let dictionary = $a9f502cbcdb3951f$var$cachedGlobalStrings === null || $a9f502cbcdb3951f$var$cachedGlobalStrings === void 0 ? void 0 : $a9f502cbcdb3951f$var$cachedGlobalStrings[packageName];
        if (!dictionary) throw new Error(`Strings for package "${packageName}" were not included by LocalizedStringProvider. Please add it to the list passed to createLocalizedStringDictionary.`);
        return dictionary;
    }
    constructor(messages, defaultLocale = 'en-US'){
        // Clone messages so we don't modify the original object.
        // Filter out entries with falsy values which may have been caused by applying optimize-locales-plugin.
        this.strings = Object.fromEntries(Object.entries(messages).filter(([, v])=>v));
        this.defaultLocale = defaultLocale;
    }
}
function $a9f502cbcdb3951f$var$getStringsForLocale(locale, strings, defaultLocale = 'en-US') {
    // If there is an exact match, use it.
    if (strings[locale]) return strings[locale];
    // Attempt to find the closest match by language.
    // For example, if the locale is fr-CA (French Canadian), but there is only
    // an fr-FR (France) set of strings, use that.
    // This could be replaced with Intl.LocaleMatcher once it is supported.
    // https://github.com/tc39/proposal-intl-localematcher
    let language = $a9f502cbcdb3951f$var$getLanguage(locale);
    if (strings[language]) return strings[language];
    for(let key in strings){
        if (key.startsWith(language + '-')) return strings[key];
    }
    // Nothing close, use english.
    return strings[defaultLocale];
}
function $a9f502cbcdb3951f$var$getLanguage(locale) {
    // @ts-ignore
    if (Intl.Locale) // @ts-ignore
    return new Intl.Locale(locale).language;
    return locale.split('-')[0];
}


export {$a9f502cbcdb3951f$export$c17fa47878dc55b6 as LocalizedStringDictionary};
//# sourceMappingURL=LocalizedStringDictionary.js.map
