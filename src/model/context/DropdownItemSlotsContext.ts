import {
    type ReactNode,
    createContext
} from "react";

export type DropdownItemSlotsContextType = {
    setLabel: (node: ReactNode | null) => void;
    setSubmenu: (node: ReactNode | null) => void;
    setSubmenuID: (id: string | null) => void;
};

export const DropdownItemSlotsContext =
    createContext<DropdownItemSlotsContextType | null>(null);

DropdownItemSlotsContext.displayName = "DropdownItemSlotsContext";
