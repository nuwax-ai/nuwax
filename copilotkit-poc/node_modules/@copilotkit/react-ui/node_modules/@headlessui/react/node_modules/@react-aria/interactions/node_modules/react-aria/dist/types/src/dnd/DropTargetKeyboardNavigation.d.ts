import { Collection, DropTarget, KeyboardDelegate, Node } from '@react-types/shared';
export declare function navigate(keyboardDelegate: KeyboardDelegate, collection: Collection<Node<unknown>>, target: DropTarget | null | undefined, direction: 'left' | 'right' | 'up' | 'down', rtl?: boolean, wrap?: boolean): DropTarget | null;
