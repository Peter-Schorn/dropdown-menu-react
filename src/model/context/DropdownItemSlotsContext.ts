import {
    type ReactNode,
    type RefObject,
    createContext,
} from "react";

export type DropdownItemSlots = {
    label?: ReactNode;
    submenu?: ReactNode;
    submenuID?: string;
};

export type DropdownItemSlotsContextType = RefObject<DropdownItemSlots>;

export const DropdownItemSlotsContext =
    createContext<DropdownItemSlotsContextType | null>(null);

DropdownItemSlotsContext.displayName = "DropdownItemSlotsContext";
