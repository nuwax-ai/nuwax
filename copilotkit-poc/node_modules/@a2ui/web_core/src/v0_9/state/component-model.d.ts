import { EventSource } from '../common/events.js';
/**
 * Represents the state model for an individual UI component.
 */
export declare class ComponentModel {
    readonly id: string;
    readonly type: string;
    private _properties;
    private readonly _onUpdated;
    /**
     * Fires whenever the component's properties are updated.
     */
    readonly onUpdated: EventSource<ComponentModel>;
    /**
     * Creates a new component model.
     *
     * @param id The unique identifier for this component.
     * @param type The component type name.
     * @param initialProperties The initial properties for the component.
     */
    constructor(id: string, type: string, initialProperties: Record<string, any>);
    /**
     * The current properties of the component.
     */
    get properties(): Record<string, any>;
    set properties(newProperties: Record<string, any>);
    /**
     * Disposes of the component and its resources.
     */
    dispose(): void;
    /**
     * Returns a JSON representation of the component tree.
     */
    get componentTree(): any;
}
//# sourceMappingURL=component-model.d.ts.map