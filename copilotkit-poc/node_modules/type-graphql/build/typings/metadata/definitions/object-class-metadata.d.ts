import { type ClassMetadata } from "./class-metadata.js";
export type ObjectClassMetadata = {
    interfaceClasses: Function[] | undefined;
} & ClassMetadata;
