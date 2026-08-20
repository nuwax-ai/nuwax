import type { Maybe } from './Maybe';
import type { ReadOnlyObjMap, ReadOnlyObjMapLike } from './ObjMap';
/** @internal */
export declare function toObjMap<T>(
  obj: Maybe<ReadOnlyObjMapLike<T>>,
): ReadOnlyObjMap<T>;
