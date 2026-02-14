export enum DropdownMenuEventType {
    RepositionSubmenu = "reposition-submenu",
    HoveredMenuItemChange = "hovered-menu-item-change"
}

/**
 * The phase of the repositioning process for a submenu.
 * - "initial": The initial phase when the submenu is first opened and
 *   positioned. When dropdown menus are opened, they must be positioned in
 *   order based on their depth in the menu hierarchy. Therefore, a
 *   `DropdownMenuRepositionSubmenuEvent` with the "initial" phase is emitted
 *   for each submenu in order of its depth every time a submenu is opened.
 *   However, some menus may have already been opened and positioned, in which
 *   case they should ignore the "initial" phase and not reposition.
 * - "reposition": The phase when the submenu is being repositioned due to
 *   changes to the visual viewport or other factors that affect the layout of
 *   the menus.
 */
export type DropdownMenuRepositionSubmenuEventPhase =
    | "initial"
    | "reposition";

export type DropdownMenuRepositionSubmenuEvent = {
    type: DropdownMenuEventType.RepositionSubmenu;
    submenuID: string;
    phase: DropdownMenuRepositionSubmenuEventPhase;
};

export type DropdownMenuHoveredMenuItemChangeEvent = {
    type: DropdownMenuEventType.HoveredMenuItemChange;
    hoveredMenuItem: string | null;
};

export type DropdownMenuEvent =
    | DropdownMenuRepositionSubmenuEvent
    | DropdownMenuHoveredMenuItemChangeEvent;

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
