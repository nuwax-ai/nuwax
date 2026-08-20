export declare const warnPrefix: string;
export declare const infoPrefix: string;
export declare const errorPrefix: string;
export declare const debugPrefix: string;
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type YogaLogger = Record<LogLevel, (...args: any[]) => void>;
export declare const createLogger: (logLevel?: LogLevel | "silent") => YogaLogger;
