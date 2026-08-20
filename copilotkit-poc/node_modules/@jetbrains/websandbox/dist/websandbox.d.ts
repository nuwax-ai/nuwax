import Connection from './connection';
import { API } from './types';
export interface SandboxOptions {
    frameContainer: string | Element;
    frameClassName?: string;
    frameSrc?: string | null;
    frameContent?: string;
    codeToRunBeforeInit?: string | null;
    initialStyles?: string | null;
    baseUrl?: string | null;
    allowPointerLock?: boolean;
    allowFullScreen?: boolean;
    sandboxAdditionalAttributes?: string;
    allowAdditionalAttributes?: string;
}
export declare const BaseOptions: SandboxOptions;
declare class Websandbox {
    options: SandboxOptions;
    iframe: HTMLIFrameElement;
    promise: Promise<unknown>;
    connection: Connection | null;
    removeMessageListener: () => void;
    /**
     * Creates sandbox instancea
     * @param localApi Api of this side. Will be available for sandboxed code as remoteApi
     * @param options Options of created sandbox
     */
    static create(localApi: API, options?: Partial<SandboxOptions>): Websandbox;
    /**
     * {Constructor}
     * @param localApi
     * @param options
     */
    constructor(localApi: API, options: Partial<SandboxOptions>);
    validateOptions(options: Partial<SandboxOptions>): void;
    _prepareFrameContent(options: SandboxOptions): string;
    createIframe(): HTMLIFrameElement;
    destroy(): void;
    _runCode(code: string): Promise<unknown>;
    _runFunction(fn: Function): Promise<unknown>;
    run(codeOrFunction: string | Function): Promise<unknown>;
    importScript(path: string): Promise<unknown>;
    injectStyle(style: string): Promise<unknown>;
}
export default Websandbox;
