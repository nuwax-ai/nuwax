import { type ArgParamMetadata, type ArgsParamMetadata } from "../metadata/definitions/index.js";
import { type ArgsDictionary } from "../typings/index.js";
export declare function convertArgsToInstance(argsMetadata: ArgsParamMetadata, args: ArgsDictionary): object | undefined;
export declare function convertArgToInstance(argMetadata: ArgParamMetadata, args: ArgsDictionary): any;
