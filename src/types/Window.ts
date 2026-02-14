import type { MenuItemNode } from "../model/MenuItemNode";
import type { ReactNode } from "react";
import type {
    DropdownMenuRepositionSubmenuEventPhase
} from "../model/DropdownMenuEventEmitter";

declare global {
    interface Window {
        // MARK: Dropdown Menu
        openSubmenu?: (submenuID: string) => void;
        closeSubmenu?: (submenuID: string) => void;
        getOpenMenuIDs?: () => string[];
        getMenuItemTree?: () => MenuItemNode;
        buildMenuItemTree?: () => void;
        positionDropdownMenu?: (
            phase?: DropdownMenuRepositionSubmenuEventPhase
        ) => void;

        summarizeReactChildren?: (children: ReactNode) => unknown;
    }
}
