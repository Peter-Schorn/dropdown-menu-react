import {
    type RefObject,
    createContext
} from "react";

export type DropdownSubmenuContextType = {
    readonly parentDropdownMenuMeasuringContainerRef: RefObject<HTMLDivElement | null>;
};

export const dropdownSubmenuContextDefaultValue: DropdownSubmenuContextType = {
    parentDropdownMenuMeasuringContainerRef: { current: null }
};

export const DropdownSubmenuContext = createContext<DropdownSubmenuContextType>(
    dropdownSubmenuContextDefaultValue
);

DropdownSubmenuContext.displayName = "DropdownSubmenuContext";
