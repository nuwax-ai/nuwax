import { type DirectiveMetadata } from "./directive-metadata.js";
import { type ExtensionsMetadata } from "./extensions-metadata.js";
import { type FieldMetadata } from "./field-metadata.js";
export interface ClassMetadata {
    name: string;
    target: Function;
    fields?: FieldMetadata[];
    description?: string;
    directives?: DirectiveMetadata[];
    extensions?: ExtensionsMetadata;
    simpleResolvers?: boolean;
}
