import { type DescriptionOptions } from "./types.js";
export type InputTypeOptions = DescriptionOptions;
export declare function InputType(): ClassDecorator;
export declare function InputType(options: InputTypeOptions): ClassDecorator;
export declare function InputType(name: string, options?: InputTypeOptions): ClassDecorator;
