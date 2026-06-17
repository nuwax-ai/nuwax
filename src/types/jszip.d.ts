/**
 * JSZip 类型声明
 * 由于 jszip 包本身不包含 TypeScript 类型定义，这里添加基本的类型声明
 */

declare module 'jszip' {
  class JSZip {
    loadAsync<T extends string | ArrayBuffer | Blob>(
      data: T,
      options?: any,
    ): Promise<JSZip>;
    file(name: string, data?: any, options?: any): JSZip;
    generateAsync(options?: any): Promise<Blob>;
    generateAsync<T extends 'blob' | 'arraybuffer' | 'base64'>(
      type?: T,
      options?: any,
    ): Promise<
      T extends 'blob' ? Blob : T extends 'base64' ? string : ArrayBuffer
    >;
    files: { [key: string]: JSZip.JSZipObject };
  }

  namespace JSZip {
    export interface JSZipObject {
      name: string;
      dir: boolean;
      date: Date;
      comment: string | null;
      unixPermissions: number | null;
      dosPermissions: number | null;
      async(type: 'text'): Promise<string>;
      async(type: 'arraybuffer'): Promise<ArrayBuffer>;
      async(type: 'base64'): Promise<string>;
      async(type: 'blob'): Promise<Blob>;
      async(type: 'uint8array'): Promise<Uint8Array>;
      async(type: string): Promise<string | ArrayBuffer | Blob>;
    }
  }

  export default JSZip;
}
