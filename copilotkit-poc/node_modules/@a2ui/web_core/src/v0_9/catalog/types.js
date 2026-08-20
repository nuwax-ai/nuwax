/*
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { z } from 'zod';
import { A2uiExpressionError } from '../errors.js';
/**
 * Robust check for a Preact Signal that works across package boundaries.
 */
export function isSignal(val) {
    return val && typeof val === 'object' && 'value' in val && 'peek' in val;
}
export function createFunctionImplementation(api, execute) {
    return {
        name: api.name,
        returnType: api.returnType,
        schema: api.schema,
        execute: execute,
    };
}
/**
 * A collection of available components and functions.
 */
export class Catalog {
    constructor(id, components, functions = [], themeSchema) {
        this.id = id;
        const compMap = new Map();
        for (const comp of components) {
            compMap.set(comp.name, comp);
        }
        this.components = compMap;
        const funcMap = new Map();
        for (const fn of functions) {
            funcMap.set(fn.name, fn);
        }
        this.functions = funcMap;
        this.themeSchema = themeSchema;
        this.invoker = (name, rawArgs, ctx, abortSignal) => {
            const fn = this.functions.get(name);
            if (!fn) {
                throw new A2uiExpressionError(`Function not found in catalog '${this.id}': ${name}`, name);
            }
            // Provides runtime safety: Coerces and strips invalid arguments before execute()
            try {
                const safeArgs = fn.schema.parse(rawArgs);
                return fn.execute(safeArgs, ctx, abortSignal);
            }
            catch (e) {
                if (e?.name === 'ZodError' || e instanceof z.ZodError) {
                    throw new A2uiExpressionError(`Validation failed for function '${name}': ${e.message}`, name, e.errors ?? e.issues);
                }
                throw e;
            }
        };
    }
}
//# sourceMappingURL=types.js.map