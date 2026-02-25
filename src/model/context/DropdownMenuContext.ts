import {
    type RefObject,
    createContext
} from "react";

import {
    type DropdownMenuRepositionSubmenuEventPhase,
    DropdownMenuEventEmitter
} from "../DropdownMenuEventEmitter";

import {
    type HorizontalEdge
} from "../../types/misc";

export type DropdownMenuContextType = Readonly<{
    menuItemsAlignmentRef: RefObject<Map<string, HorizontalEdge>>;
    mainDropdownMenuEventEmitter: DropdownMenuEventEmitter;
    hoveredMenuItemRef: RefObject<string | null>;

    /**
     * When the scroll arrow disappears while the pointer is down, then when the
     * pointer is released, a click event is fired on the element below the
     * scroll arrow. We do not want to handle this click event, as it is not
     * really an intentional user click, but rather a side effect of the scroll
     * arrow disappearing while the pointer is down.
     */
    ignoreClicksUntilNextPointerDownRef: RefObject<boolean>;

    mouseHoverEventsRef: RefObject<boolean>;
    closeOnClickLeafItemRef: RefObject<boolean>;
    pointerEnterExitDelayMSRef: RefObject<number>;

    setHoveredMenuItem: (menuIemID: string | null) => void;
    scheduleDropdownMenuReposition: (
        phase: DropdownMenuRepositionSubmenuEventPhase
    ) => void;
    openSubmenu: (submenuID: string) => void;
    closeSubmenu: (submenuID: string) => void;

}>;

export const dropdownMenuContextDefaultValue: DropdownMenuContextType = {
    menuItemsAlignmentRef: { current: new Map<string, HorizontalEdge>() },
    mainDropdownMenuEventEmitter: new DropdownMenuEventEmitter(),
    hoveredMenuItemRef: { current: null },
    ignoreClicksUntilNextPointerDownRef: { current: false },
    mouseHoverEventsRef: { current: true },
    closeOnClickLeafItemRef: { current: true },
    pointerEnterExitDelayMSRef: { current: 200 },
    setHoveredMenuItem: () => {
        // default implementation does nothing
    },
    scheduleDropdownMenuReposition: () => {
        // default implementation does nothing
    },
    openSubmenu: () => {
        // default implementation does nothing
    },
    closeSubmenu: () => {
        // default implementation does nothing
    }
};

export const DropdownMenuContext = createContext<DropdownMenuContextType>(
    dropdownMenuContextDefaultValue
);

DropdownMenuContext.displayName = "DropdownMenuContext";
