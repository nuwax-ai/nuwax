//#region src/types/action.d.ts
type TypeMap = {
  string: string;
  number: number;
  boolean: boolean;
  object: object;
  "string[]": string[];
  "number[]": number[];
  "boolean[]": boolean[];
  "object[]": object[];
};
type AbstractParameter = {
  name: string;
  type?: keyof TypeMap;
  description?: string;
  required?: boolean;
};
interface StringParameter extends AbstractParameter {
  type: "string";
  enum?: string[];
}
interface ObjectParameter extends AbstractParameter {
  type: "object";
  attributes?: Parameter[];
}
interface ObjectArrayParameter extends AbstractParameter {
  type: "object[]";
  attributes?: Parameter[];
}
type SpecialParameters = StringParameter | ObjectParameter | ObjectArrayParameter;
interface BaseParameter extends AbstractParameter {
  type?: Exclude<AbstractParameter["type"], SpecialParameters["type"]>;
}
type Parameter = BaseParameter | SpecialParameters;
type OptionalParameterType<P extends AbstractParameter> = P["required"] extends false ? undefined : never;
type StringParameterType<P> = P extends StringParameter ? P extends {
  enum?: Array<infer E>;
} ? E : string : never;
type ObjectParameterType<P> = P extends ObjectParameter ? P extends {
  attributes?: infer Attributes extends Parameter[];
} ? MappedParameterTypes<Attributes> : object : never;
type ObjectArrayParameterType<P> = P extends ObjectArrayParameter ? P extends {
  attributes?: infer Attributes extends Parameter[];
} ? MappedParameterTypes<Attributes>[] : any[] : never;
type MappedTypeOrString<T> = T extends keyof TypeMap ? TypeMap[T] : string;
type BaseParameterType<P extends AbstractParameter> = P extends {
  type: infer T;
} ? T extends BaseParameter["type"] ? MappedTypeOrString<T> : never : string;
type MappedParameterTypes<T extends Parameter[] | [] = []> = T extends [] ? Record<string, any> : { [P in T[number] as P["name"]]: OptionalParameterType<P> | StringParameterType<P> | ObjectParameterType<P> | ObjectArrayParameterType<P> | BaseParameterType<P> };
type Action<T extends Parameter[] | [] = []> = {
  name: string;
  description?: string;
  parameters?: T;
  handler?: T extends [] ? () => any | Promise<any> : (args: MappedParameterTypes<T>) => any | Promise<any>;
  additionalConfig?: Record<string, any>;
};
//#endregion
export { Action, MappedParameterTypes, Parameter };
//# sourceMappingURL=action.d.mts.map