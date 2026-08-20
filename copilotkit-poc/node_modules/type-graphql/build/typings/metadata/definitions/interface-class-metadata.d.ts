import { type TypeResolver } from "../../typings/index.js";
import { type ClassMetadata } from "./class-metadata.js";
export type InterfaceClassMetadata = {
    resolveType?: TypeResolver<any, any>;
    autoRegisteringDisabled: boolean;
    interfaceClasses: Function[] | undefined;
} & ClassMetadata;
