import { type DescriptionOptions, type ImplementsClassOptions } from "./types.js";
export type ObjectTypeOptions = DescriptionOptions & ImplementsClassOptions & {
    /** Set to `true` to disable auth and all middlewares stack for all this Object Type fields resolvers */
    simpleResolvers?: boolean;
};
export declare function ObjectType(): ClassDecorator;
export declare function ObjectType(options: ObjectTypeOptions): ClassDecorator;
export declare function ObjectType(name: string, options?: ObjectTypeOptions): ClassDecorator;
