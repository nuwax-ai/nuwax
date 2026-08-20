import { ChildProcess, SpawnOptions } from 'node:child_process';
import { ColorSupport } from 'supports-color';
import { SpawnCommand } from './command.js';
/**
 * Creates a spawn function that uses the given shell executable.
 *
 * The shell is resolved in the following priority order:
 * 1. explicit shell option
 * 2. `npm_config_script_shell` env variable
 * 3. platform default (`cmd.exe` on Windows, `/bin/sh` elsewhere)
 *
 * @see https://docs.npmjs.com/cli/v6/using-npm/config#script-shell
 */
export declare function createSpawn(shell?: string, spawn?: (command: string, args: string[], options: SpawnOptions) => ChildProcess, process?: Pick<NodeJS.Process, 'platform' | 'env'>): SpawnCommand;
export type ShellKind = 'cmd' | 'posix' | 'powershell';
export declare const getSpawnOpts: ({ colorSupport, cwd, process, ipc, stdio, env, }: {
    /**
     * What the color support of the spawned processes should be.
     * If set to `false`, then no colors should be output.
     *
     * Defaults to whatever the terminal's stdout support is.
     */
    colorSupport?: Pick<ColorSupport, "level"> | false;
    /**
     * The NodeJS process.
     */
    process?: Pick<NodeJS.Process, "cwd" | "platform" | "env">;
    /**
     * A custom working directory to spawn processes in.
     * Defaults to `process.cwd()`.
     */
    cwd?: string;
    /**
     * The file descriptor number at which the channel for inter-process communication
     * should be set up.
     */
    ipc?: number;
    /**
     * Which stdio mode to use. Raw implies inheriting the parent process' stdio.
     *
     * - `normal`: all of stdout, stderr and stdin are piped
     * - `hidden`: stdin is piped, stdout/stderr outputs are ignored
     * - `raw`: all of stdout, stderr and stdin are inherited from the main process
     *
     * Defaults to `normal`.
     */
    stdio?: "normal" | "hidden" | "raw";
    /**
     * Map of custom environment variables to include in the spawn options.
     */
    env?: Record<string, unknown>;
}) => SpawnOptions;
