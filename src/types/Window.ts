import type { MenuItemNode } from "../model/MenuItemNode";
import type { ReactNode } from "react";

declare global {
    interface Window {
        // MARK: Dropdown Menu
        openSubmenu?: (submenuID: string) => void;
        closeSubmenu?: (submenuID: string) => void;
        getOpenMenuIDs?: () => string[];
        getMenuItemTree?: () => MenuItemNode;
        buildMenuItemTree?: () => void;
        positionDropdownMenu?: () => void;

        summarizeReactChildren?: (children: ReactNode) => unknown;
    }
}
