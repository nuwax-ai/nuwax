import React, { memo, useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { GenericBinder } from "@a2ui/web_core/v0_9";
import { jsx } from "react/jsx-runtime";

//#region src/react-renderer/a2ui-react/adapter.tsx
/**
* Copyright 2026 Google LLC
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*     http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
/**
* Creates a React component implementation using the deep generic binder.
*/
function createReactComponent(api, RenderComponent) {
	const MemoizedRender = memo(RenderComponent, (prev, next) => {
		if (prev.props !== next.props) return false;
		if (prev.context.componentModel.id !== next.context.componentModel.id) return false;
		if (prev.context.dataContext.path !== next.context.dataContext.path) return false;
		return true;
	});
	const ReactWrapper = ({ context, buildChild }) => {
		const bindingRef = useRef(null);
		if (!bindingRef.current) bindingRef.current = new GenericBinder(context, api.schema);
		else if (bindingRef.current.context !== context) {
			bindingRef.current.dispose();
			bindingRef.current = new GenericBinder(context, api.schema);
		}
		const binding = bindingRef.current;
		const props = useSyncExternalStore(useCallback((callback) => {
			const sub = binding.subscribe(callback);
			return () => sub.unsubscribe();
		}, [binding]), useCallback(() => binding.snapshot, [binding]));
		useEffect(() => {
			return () => binding.dispose();
		}, [binding]);
		return /* @__PURE__ */ jsx(MemoizedRender, {
			props: props || {},
			buildChild,
			context
		});
	};
	return {
		name: api.name,
		schema: api.schema,
		render: ReactWrapper
	};
}

//#endregion
export { createReactComponent };
//# sourceMappingURL=adapter.mjs.map