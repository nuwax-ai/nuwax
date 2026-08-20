import { SurfaceModel } from './surface-model.js';
import { ComponentApi } from '../catalog/types.js';
import { EventSource } from '../common/events.js';
import { A2uiClientAction } from '../schema/client-to-server.js';
/**
 * The root state model for the A2UI system.
 * Manages the collection of active surfaces.
 */
export declare class SurfaceGroupModel<T extends ComponentApi> {
    private surfaces;
    private surfaceUnsubscribers;
    private readonly _onSurfaceCreated;
    private readonly _onSurfaceDeleted;
    private readonly _onAction;
    /** Fires when a new surface is added. */
    readonly onSurfaceCreated: EventSource<SurfaceModel<T>>;
    /** Fires when a surface is removed. */
    readonly onSurfaceDeleted: EventSource<string>;
    /** Fires when an action is dispatched from ANY surface in the group. */
    readonly onAction: EventSource<A2uiClientAction>;
    /**
     * Adds a surface to the group.
     * Ignores if a surface with the same ID already exists.
     *
     * @param surface The surface model to add.
     */
    addSurface(surface: SurfaceModel<T>): void;
    /**
     * Removes a surface from the group by its ID.
     * Disposes of the surface upon removal.
     *
     * @param id The ID of the surface to remove.
     */
    deleteSurface(id: string): void;
    /**
     * Retrieves a surface by its ID.
     *
     *
     * @param id The ID of the surface to retrieve.
     * @returns The surface model, or undefined if not found.
     */
    getSurface(id: string): SurfaceModel<T> | undefined;
    /**
     * Returns a readonly map of all active surfaces.
     */
    get surfacesMap(): ReadonlyMap<string, SurfaceModel<T>>;
    /**
     * Disposes of the group and all its surfaces.
     */
    dispose(): void;
}
//# sourceMappingURL=surface-group-model.d.ts.map