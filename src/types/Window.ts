import { MenuItemNode } from "../model/MenuItemNode";

declare global {
    interface Window {
        openSubmenu?: (submenuID: string) => void;
        closeSubmenu?: (submenuID: string) => void;
        getOpenMenuIDs?: () => string[];
        getMenuItemTree?: () => MenuItemNode;
        buildMenuItemTree?: () => void;
        positionDropdownMenu?: () => void;
    }
}
