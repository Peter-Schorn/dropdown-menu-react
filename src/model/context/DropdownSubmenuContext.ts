import {
    type RefObject,
    createContext
} from "react";

import type {
    DropdownMenuCoreHandle
} from "../../components/DropdownMenuCore";

import type {
    CustomScrollbarHandle
} from "../../components/CustomScrollbar";

export type DropdownSubmenuContextType = Readonly<{
    dropdownMenuMeasuringContainerRef: RefObject<HTMLDivElement | null>;
    dropdownMenuRef: RefObject<HTMLDivElement | null>;
    dropdownMenuContentRef: RefObject<HTMLDivElement | null>;
    dropdownMenuCoreRef: RefObject<DropdownMenuCoreHandle | null>;
    customScrollbarRef: RefObject<CustomScrollbarHandle | null>;
}>;

export const dropdownSubmenuContextDefaultValue: DropdownSubmenuContextType = {
    dropdownMenuMeasuringContainerRef: { current: null },
    dropdownMenuRef: { current: null },
    dropdownMenuContentRef: { current: null },
    dropdownMenuCoreRef: { current: null },
    customScrollbarRef: { current: null }
};

export const DropdownSubmenuContext = createContext<DropdownSubmenuContextType>(
    dropdownSubmenuContextDefaultValue
);

DropdownSubmenuContext.displayName = "DropdownSubmenuContext";
