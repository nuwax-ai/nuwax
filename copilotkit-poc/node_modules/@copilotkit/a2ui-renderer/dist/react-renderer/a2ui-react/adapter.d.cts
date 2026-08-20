import React from "react";
import { ComponentApi, ComponentContext, InferredComponentApiSchemaType, ResolveA2uiProps } from "@a2ui/web_core/v0_9";

//#region src/react-renderer/a2ui-react/adapter.d.ts
interface ReactComponentImplementation extends ComponentApi {
  /** The framework-specific rendering wrapper. */
  render: React.FC<{
    context: ComponentContext;
    buildChild: (id: string, basePath?: string) => React.ReactNode;
  }>;
}
type ReactA2uiComponentProps<T> = {
  props: T;
  buildChild: (id: string, basePath?: string) => React.ReactNode;
  context: ComponentContext;
};
/**
 * Creates a React component implementation using the deep generic binder.
 */
declare function createReactComponent<Api extends ComponentApi>(api: Api, RenderComponent: React.FC<ReactA2uiComponentProps<ResolveA2uiProps<InferredComponentApiSchemaType<Api>>>>): ReactComponentImplementation;
//#endregion
export { ReactA2uiComponentProps, ReactComponentImplementation, createReactComponent };
//# sourceMappingURL=adapter.d.cts.map