import * as react from "react";
import { ReactNode } from "react";

//#region src/react-renderer/core/A2UIRenderer.d.ts
interface A2UIRendererProps {
  /** The surface ID to render */
  surfaceId: string;
  /** Additional CSS classes for the surface container */
  className?: string;
  /** Fallback content when surface is not yet available */
  fallback?: ReactNode;
  /** Loading fallback for lazy-loaded components */
  loadingFallback?: ReactNode;
  /** @deprecated - No longer needed in v0.9, components come from catalog */
  registry?: any;
}
/**
 * A2UIRenderer - renders an A2UI surface using the v0.9 renderer.
 *
 * Uses A2uiSurface from a2ui-react which handles all component
 * rendering internally via the catalog system.
 */
declare const A2UIRenderer: react.NamedExoticComponent<A2UIRendererProps>;
//#endregion
export { A2UIRenderer, A2UIRendererProps };
//# sourceMappingURL=A2UIRenderer.d.mts.map