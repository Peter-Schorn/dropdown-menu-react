import {
    createContext,
    useContext,
    useState
} from "react";

import {
    type Mutate,
    type StoreApi,
    createStore
} from "zustand";

import {
    subscribeWithSelector
} from "zustand/middleware";

export type DropdownSubmenuStore = Readonly<{
    isSubmenu: boolean;
    setIsSubmenu: (isSubmenu: boolean) => void;

    submenuID: string;
    setSubmenuID: (submenuID: string) => void;

    scrollbarHitbox: HTMLDivElement | null;
    setScrollbarHitbox: (scrollbarHitbox: HTMLDivElement | null) => void;
}>;

export type DropdownSubmenuStoreContextType = Mutate<
    StoreApi<DropdownSubmenuStore>,
    [["zustand/subscribeWithSelector", never]]
>;

function createDropdownSubmenuStore(): DropdownSubmenuStoreContextType {
    return createStore<DropdownSubmenuStore>()(subscribeWithSelector((set) => ({
        isSubmenu: false,
        setIsSubmenu: (isSubmenu: boolean): void => {
            set((state) => {
                if (state.isSubmenu === isSubmenu) {
                    return state;
                }
                return {
                    isSubmenu
                };
            });
        },

        submenuID: "",
        setSubmenuID: (submenuID: string): void => {
            set((state) => {
                if (state.submenuID === submenuID) {
                    return state;
                }
                return {
                    submenuID
                };
            });
        },

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
    })));
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
    isSubmenu: false,
    setIsSubmenu: () => { },
    submenuID: "",
    setSubmenuID: () => { },
    scrollbarHitbox: null,
    setScrollbarHitbox: () => { }
};

export const mockDropdownSubmenuStoreContextValue: DropdownSubmenuStoreContextType = {
    getInitialState: () => mockDropdownSubmenuStore,
    getState: () => mockDropdownSubmenuStore,
    setState: () => { },
    subscribe: () => () => { }
};
