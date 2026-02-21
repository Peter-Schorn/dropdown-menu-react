import {
    type StoreApi,
    createStore
} from "zustand/vanilla";

import {
    type ReactNode,
    createContext,
    useContext,
    useState
} from "react";

export type DropdownItemSlotsStoreSetSubmenuOptions = {
    submenu: ReactNode | null;
    submenuID: string | null;
};

export type DropdownItemSlotsStore = {
    label: ReactNode | null;
    submenu: ReactNode | null;
    submenuID: string | null;

    setLabel(label: ReactNode | null): void;
    setSubmenu(options: DropdownItemSlotsStoreSetSubmenuOptions): void;
};

export type DropdownItemSlotsStoreContextType = StoreApi<DropdownItemSlotsStore>;

export function createDropdownItemSlotsStore(): DropdownItemSlotsStoreContextType {
    return createStore<DropdownItemSlotsStore>((set) => ({
        label: null,
        submenu: null,
        submenuID: null,

        setLabel(label: ReactNode | null): void {
            set(() => ({
                label
            }));
        },

        setSubmenu(options): void {
            set(() => options);
        }
    }));
}

/**
 * A custom hook that creates and returns a dropdown item slots store. This is
 * used internally by the `DropdownItem` component to create a store for
 * managing the label and submenu slots of the dropdown item.
 */
export function useCreateDropdownItemSlotsStore(): DropdownItemSlotsStoreContextType {
    return useState(() => createDropdownItemSlotsStore())[0];
}

export const DropdownItemSlotsStoreContext =
    createContext<DropdownItemSlotsStoreContextType | null>(null);

DropdownItemSlotsStoreContext.displayName = "DropdownItemSlotsContext";

export type UseDropdownItemSlotsStoreContextOptions = {
    componentName?: string;
};

/**
 * Returns the dropdown item slots store from the context. Must be used within a
 * DropdownItemSlotsStoreContext.Provider.
 */
export function useDropdownItemSlotsStoreContext(
    {
        componentName
    }: UseDropdownItemSlotsStoreContextOptions = {}
): DropdownItemSlotsStoreContextType {

    const context = useContext(DropdownItemSlotsStoreContext);

    if (!context) {
        const errorMessage = componentName
            ? `${componentName} must be used within DropdownItem`
            : "DropdownItem: DropdownItemSlotsStoreContext.Provider is missing";

        throw new Error(errorMessage);
    }

    return context;

}
