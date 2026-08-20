import { type ClassType } from "../typings/index.js";
import { type ClassTypeResolver } from "./types.js";
export declare function Resolver(): ClassDecorator;
export declare function Resolver(typeFunc: ClassTypeResolver): ClassDecorator;
export declare function Resolver(objectType: ClassType): ClassDecorator;
