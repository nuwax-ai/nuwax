import type { Root as HastRoot } from "hast";
export declare const BlockPolicy: {
    readonly indicator: "indicator";
    readonly textOnly: "text-only";
    readonly remove: "remove";
};
export type BlockPolicyType = (typeof BlockPolicy)[keyof typeof BlockPolicy];
/** @deprecated Use BlockPolicyType instead */
export type LinkBlockPolicy = BlockPolicyType;
/** @deprecated Use BlockPolicyType instead */
export type ImageBlockPolicy = BlockPolicyType;
export declare function harden({ defaultOrigin, allowedLinkPrefixes, allowedImagePrefixes, allowDataImages, allowedProtocols, blockedImageClass, blockedLinkClass, linkBlockPolicy, imageBlockPolicy, }: {
    defaultOrigin?: string;
    allowedLinkPrefixes?: string[];
    allowedImagePrefixes?: string[];
    allowDataImages?: boolean;
    allowedProtocols?: string[];
    blockedImageClass?: string;
    blockedLinkClass?: string;
    linkBlockPolicy?: BlockPolicyType;
    imageBlockPolicy?: BlockPolicyType;
}): (tree: HastRoot) => void;
//# sourceMappingURL=index.d.ts.map