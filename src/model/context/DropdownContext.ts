import {
    type RefObject,
    createContext
} from "react";

import type {
    CustomScrollbarHandle
} from "../../components/CustomScrollbar";

import type {
    DropdownMenuCoreHandle
} from "../../components/DropdownMenuCore";

export type DropdownContextType = Readonly<{
    dropdownMenuMeasuringContainerRef: RefObject<HTMLDivElement | null>;
    dropdownMenuRef: RefObject<HTMLDivElement | null>;
    dropdownMenuContentRef: RefObject<HTMLDivElement | null>;
    dropdownMenuCoreRef: RefObject<DropdownMenuCoreHandle | null>;
    customScrollbarRef: RefObject<CustomScrollbarHandle | null>;
}>;

export const dropdownContextDefaultValue: DropdownContextType = {
    dropdownMenuMeasuringContainerRef: { current: null },
    dropdownMenuRef: { current: null },
    dropdownMenuContentRef: { current: null },
    dropdownMenuCoreRef: { current: null },
    customScrollbarRef: { current: null }
};

export const DropdownContext = createContext<DropdownContextType>(
    dropdownContextDefaultValue
);

DropdownContext.displayName = "DropdownContext";
