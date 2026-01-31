import {
    type ReactNode,
    createContext,
    useContext
} from "react";

export type DropdownItemSlotsContextType = {
    setLabel: (node: ReactNode | null) => void;
    setSubmenu: (node: ReactNode | null) => void;
    setSubmenuID: (id: string | null) => void;
};

export const DropdownItemSlotsContext =
    createContext<DropdownItemSlotsContextType | null>(null);

export function useDropdownItemSlotsContext(): DropdownItemSlotsContextType {
    const context = useContext(DropdownItemSlotsContext);
    if (!context) {
        throw new Error(
            "DropdownItemSlotsContext must be used with a provider"
        );
    }
    return context;
}
