import {
    createContext,
    useContext,
    useState
} from "react";

import {
    type StoreApi,
    createStore
} from "zustand";

export type DropdownSubmenuStore = Readonly<{
    scrollbarHitbox: HTMLDivElement | null;
    setScrollbarHitbox: (scrollbarHitbox: HTMLDivElement | null) => void;
}>;

export type DropdownSubmenuStoreContextType =
    StoreApi<DropdownSubmenuStore>;

function createDropdownSubmenuStore(): DropdownSubmenuStoreContextType {
    return createStore<DropdownSubmenuStore>((set) => ({
        scrollbarHitbox: null,
        setScrollbarHitbox: (scrollbarHitbox: HTMLDivElement | null): void => {
            set((state) => {
                if (state.scrollbarHitbox === scrollbarHitbox) {
                    return state;
                }
                return {
                    scrollbarHitbox
                };
            });
        }
    }));
}

/**
 * Creates and returns a new dropdown submenu store instance that is stored in
 * react state. This is used to create a new store instance for each submenu.
 */
export function useCreateDropdownSubmenuStore(
): DropdownSubmenuStoreContextType {
    return useState(() => createDropdownSubmenuStore())[0];
}

export const DropdownSubmenuStoreContext =
    createContext<DropdownSubmenuStoreContextType | null>(null);

DropdownSubmenuStoreContext.displayName = "DropdownSubmenuStoreContext";

export function useDropdownSubmenuStoreContext(
): DropdownSubmenuStoreContextType {
    const store = useContext(DropdownSubmenuStoreContext);
    if (!store) {
        throw new Error(
            "useDropdownSubmenuStore must be used within a DropdownSubmenuStoreProvider"
        );
    }
    return store;
}

export const mockDropdownSubmenuStore: DropdownSubmenuStore = {
    scrollbarHitbox: null,
    setScrollbarHitbox: () => { }
};

export const mockDropdownSubmenuStoreContextValue: DropdownSubmenuStoreContextType = {
    getInitialState: () => mockDropdownSubmenuStore,
    getState: () => mockDropdownSubmenuStore,
    setState: () => { },
    subscribe: () => () => { }
};
