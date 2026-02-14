import {
    type Dispatch,
    type SetStateAction,
    type RefObject,
    createContext
} from "react";

// import {
//     createContext
// } from "use-context-selector";

import { MenuItemNode } from "../MenuItemNode";

import {
    type DropdownMenuRepositionSubmenuEventPhase,
    DropdownMenuEventEmitter
} from "../DropdownMenuEventEmitter";

import {
    type HorizontalEdge
} from "../../types/misc";

export type DropdownMenuContextType = {
    /**
     * Whether or not the main dropdown menu is open.
     */
    readonly isOpen: boolean;

    readonly submenusPortalContainer: HTMLDivElement | null;

    readonly menuItemTreeRef: RefObject<MenuItemNode>;
    readonly menuItemsAlignmentRef: RefObject<Map<string, HorizontalEdge>>;
    readonly mainDropdownMenuEventEmitter: DropdownMenuEventEmitter;
    readonly openMenuIDsPath: readonly string[];
    readonly openMenuIDsPathRef: RefObject<readonly string[]>;
    readonly hoveredMenuItemRef: RefObject<string | null>;
    setHoveredMenuItem: Dispatch<SetStateAction<string | null>>;
    scheduleDropdownMenuReposition: (
        phase: DropdownMenuRepositionSubmenuEventPhase
    ) => void;
    openSubmenu: (submenuID: string) => void;
    closeSubmenu: (submenuID: string) => void;

    /**
     * When the scroll arrow disappears while the pointer is down, then when the
     * pointer is released, a click event is fired on the element below the
     * scroll arrow. We do not want to handle this click event, as it is not
     * really an intentional user click, but rather a side effect of the scroll
     * arrow disappearing while the pointer is down.
     */
    ignoreClicksUntilNextPointerDownRef: RefObject<boolean>;

    /**
     * If false, mouse mouse enter and leave events do not cause the dropdown
     * menus to open or close or cause the menu to scroll when hovering over
     * scroll arrows. They still affect the appearance of the menu items.
     */
    mouseHoverEvents: boolean;

    closeOnClickLeafItem: boolean;
};

export const DropdownMenuContext = createContext<DropdownMenuContextType>({
    isOpen: false,
    submenusPortalContainer: null,
    menuItemTreeRef: { current: new MenuItemNode({ id: "" }) },
    menuItemsAlignmentRef: { current: new Map<string, HorizontalEdge>() },
    mainDropdownMenuEventEmitter: new DropdownMenuEventEmitter(),
    openMenuIDsPath: [],
    openMenuIDsPathRef: { current: [] },
    hoveredMenuItemRef: { current: null },
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
    },
    ignoreClicksUntilNextPointerDownRef: { current: false },
    mouseHoverEvents: true,
    closeOnClickLeafItem: true
});

DropdownMenuContext.displayName = "DropdownMenuContext";
