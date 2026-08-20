import { type EnumValuesConfig } from "../../decorators/types.js";
export interface EnumMetadata {
    enumObj: object;
    name: string;
    description: string | undefined;
    valuesConfig: EnumValuesConfig<any>;
}
