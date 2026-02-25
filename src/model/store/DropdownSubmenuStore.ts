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

export type DropdownSubmenuStoreProps = Readonly<{
    isSubmenu: boolean;
    submenuID: string;
    scrollbarHitbox: HTMLDivElement | null;
}>;

export type DropdownSubmenuStore = DropdownSubmenuStoreProps & Readonly<{
    setIsSubmenu: (isSubmenu: boolean) => void;
    setSubmenuID: (submenuID: string) => void;
    setScrollbarHitbox: (scrollbarHitbox: HTMLDivElement | null) => void;
}>;

export type DropdownSubmenuStoreContextType = Mutate<
    StoreApi<DropdownSubmenuStore>,
    [["zustand/subscribeWithSelector", never]]
>;

export type CreateDropdownSubmenuStoreProps =
    Partial<DropdownSubmenuStoreProps>;

function createDropdownSubmenuStore(
    {
        isSubmenu = false,
        submenuID = "",
        scrollbarHitbox = null
    }: CreateDropdownSubmenuStoreProps
): DropdownSubmenuStoreContextType {
    return createStore<DropdownSubmenuStore>()(subscribeWithSelector((set) => ({
        isSubmenu,
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

        submenuID,
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

        scrollbarHitbox,
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
    props: CreateDropdownSubmenuStoreProps
): DropdownSubmenuStoreContextType {
    return useState(() => createDropdownSubmenuStore(props))[0];
}

export const DropdownSubmenuStoreContext =
    createContext<DropdownSubmenuStoreContextType | null>(null);

DropdownSubmenuStoreContext.displayName = "DropdownSubmenuStoreContext";

export function useDropdownSubmenuStoreContext(
): DropdownSubmenuStoreContextType {
    const store = useContext(DropdownSubmenuStoreContext);
    if (!store) {
        throw new Error(
            "useDropdownSubmenuStore must be used within a " +
            "DropdownSubmenuStoreProvider"
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
