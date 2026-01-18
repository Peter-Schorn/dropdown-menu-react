export enum DropdownMenuEventType {
    RepositionSubmenu = "reposition-submenu",
    MouseMove = "mouse-move"
}

export type DropdownMenuRepositionSubmenuEvent = {
    type: DropdownMenuEventType.RepositionSubmenu;
    submenuID: string;
};

export type DropdownMenuMouseMoveEvent = {
    type: DropdownMenuEventType.MouseMove;
    event: MouseEvent;
};

// more event types can be added as needed

export type DropdownMenuEvent =
    | DropdownMenuRepositionSubmenuEvent
    | DropdownMenuMouseMoveEvent;
// more events can be added as needed

export type DropdownMenuEventListener<T extends DropdownMenuEvent> =
    (event: T) => void;

/**
 * Utility type to extract the event type from a given DropdownMenuEvent.
 */
export type ExtractDropdownMenuEventFromType<T extends DropdownMenuEventType> =
    Extract<DropdownMenuEvent, { type: T }>;

/**
 * Utility type to extract the event from a given DropdownMenuEventType.
 */
export type ExtractDropdownMenuTypeFromEvent<T extends DropdownMenuEvent> =
    T["type"];

export class DropdownMenuEventEmitter {

    private eventListeners: {
        [K in DropdownMenuEventType]?: Map<
            string,
            DropdownMenuEventListener<ExtractDropdownMenuEventFromType<K>>
        >;
    };

    constructor() {
        this.eventListeners = {};
    }

    addEventListener<T extends DropdownMenuEventType>(
        eventType: T,
        listener: DropdownMenuEventListener<ExtractDropdownMenuEventFromType<T>>
    ): string {

        if (!this.eventListeners[eventType]) {
            this.eventListeners[eventType] = new Map();
        }
        const id = crypto.randomUUID();

        this.eventListeners[eventType].set(id, listener);

        return id;
    }

    removeEventListener(
        id: string | null
    ): void {

        if (id === null) {
            return; // no ID provided; nothing to remove
        }

        for (
            const eventType of Object.keys(this.eventListeners) as
            DropdownMenuEventType[]
        ) {

            const listeners = this.eventListeners[eventType];
            if (listeners?.has(id)) {
                listeners.delete(id);
                if (listeners.size === 0) {
                    delete this.eventListeners[eventType];
                }
                break; // exit after removing the listener
            }
        }

    }

    removeAllEventListeners(): void {
        this.eventListeners = {};
    }

    emitEvent<
        T extends DropdownMenuEventType,
        Event extends ExtractDropdownMenuEventFromType<T>
    >(
        eventType: T,
        data: Omit<Event, "type">
    ): void {

        const event = {
            type: eventType,
            ...data
        } as Event;

        const listenersMap = this.eventListeners[eventType];
        if (listenersMap) {
            for (const [_, listener] of listenersMap) {
                listener(event);
            }
        }
    }
}
