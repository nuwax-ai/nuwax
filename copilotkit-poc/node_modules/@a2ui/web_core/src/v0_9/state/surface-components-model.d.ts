import { ComponentModel } from './component-model.js';
import { EventSource } from '../common/events.js';
/**
 * Manages the collection of components for a specific surface.
 */
export declare class SurfaceComponentsModel {
    private components;
    private readonly _onCreated;
    private readonly _onDeleted;
    /** Fires when a new component is added to the model. */
    readonly onCreated: EventSource<ComponentModel>;
    /** Fires when a component is removed, providing the ID of the deleted component. */
    readonly onDeleted: EventSource<string>;
    /**
     * Retrieves a component by its ID.
     *
     *
     * @param id The ID of the component to retrieve.
     * @returns The component model, or undefined if not found.
     */
    get(id: string): ComponentModel | undefined;
    /**
     * Returns an iterator over the components in the model.
     */
    get entries(): IterableIterator<[string, ComponentModel]>;
    /**
     * Adds a component to the model.
     * Throws an error if a component with the same ID already exists.
     *
     * @param component The component to add.
     */
    addComponent(component: ComponentModel): void;
    /**
     * Removes a component from the model by its ID.
     * Disposes of the component upon removal.
     *
     * @param id The ID of the component to remove.
     */
    removeComponent(id: string): void;
    /**
     * Disposes of the model and all its components.
     */
    dispose(): void;
}
//# sourceMappingURL=surface-components-model.d.ts.map