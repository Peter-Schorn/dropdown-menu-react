import {
    createContext,
    useContext,
    useState
} from "react";

import {
    type StoreApi,
    type Mutate,
    createStore
} from "zustand";

import {
    subscribeWithSelector
} from "zustand/middleware";

import type {
    UpdateState,
} from "../../types/misc";

import {
    arraysAreEqualShallow,
    getNextState
} from "../../utils/MiscellaneousUtilities";

export type DropdownMenuStore = Readonly<{
    /**
     * The path of open menu IDs, starting from the main dropdown menu and going
     * down the deepest open submenu.
     */
    openMenuIDsPath: readonly string[];
    setOpenMenuIDsPath: (path: UpdateState<readonly string[]>) => void;

    /**
     * The container element for the portals of all submenus.
     */
    submenusPortalContainer: HTMLDivElement | null;
    setSubmenusPortalContainer: (
        submenusPortalContainer: HTMLDivElement | null
    ) => void;

    /**
     * The ID of the dropdown item that should receive focus once its parent
     * menu opens.
     */
    pendingFocusSubmenuID: string | null;
    setPendingFocusSubmenuID: (pendingFocusSubmenuID: string | null) => void;
}>;

export type DropdownMenuStoreContextType = Mutate<
    StoreApi<DropdownMenuStore>,
    [["zustand/subscribeWithSelector", never]]
>;

// export type DropdownMenuStoreContextType =
//     StoreApi<DropdownMenuStore>;

function createDropdownMenuStore(): DropdownMenuStoreContextType {
    return createStore<DropdownMenuStore>()(subscribeWithSelector((set) => ({

        openMenuIDsPath: [],
        setOpenMenuIDsPath: (update: UpdateState<readonly string[]>): void => {
            set((state) => {
                const path = getNextState(update, state.openMenuIDsPath);

                if (arraysAreEqualShallow(state.openMenuIDsPath, path)) {
                    return state;
                }
                return {
                    openMenuIDsPath: path
                };
            });
        },

        submenusPortalContainer: null,
        setSubmenusPortalContainer: (
            submenusPortalContainer: HTMLDivElement | null
        ): void => {
            set((state) => {
                if (state.submenusPortalContainer === submenusPortalContainer) {
                    return state;
                }
                return {
                    submenusPortalContainer
                };
            });
        },

        pendingFocusSubmenuID: null,
        setPendingFocusSubmenuID: (
            pendingFocusSubmenuID: string | null
        ): void => {
            set((state) => {
                if (state.pendingFocusSubmenuID === pendingFocusSubmenuID) {
                    return state;
                }
                return {
                    pendingFocusSubmenuID
                };
            });
        },

    })));
}

/**
 * Creates and returns a new dropdown menu store instance that is stored in
 * react state. This should only be used once per dropdown menu (i.e. per
 * `DropdownMenu` component instance).
 */
export function useCreateDropdownMenuStore(): DropdownMenuStoreContextType {
    return useState(() => createDropdownMenuStore())[0];
}

export const DropdownMenuStoreContext =
    createContext<DropdownMenuStoreContextType | null>(null);

DropdownMenuStoreContext.displayName = "DropdownMenuStoreContext";

/**
 * Returns the dropdown menu store from context. Must be used within a
 * DropdownMenuStoreContext.Provider.
 */
export function useDropdownMenuStoreContext(): DropdownMenuStoreContextType {
    const context = useContext(DropdownMenuStoreContext);
    if (!context) {
        throw new Error(
            "useDropdownMenuContext must be used within a " +
            "DropdownMenuContext2.Provider"
        );
    }
    return context;
}

export const mockDropdownMenuStore: DropdownMenuStore = {
    openMenuIDsPath: [],
    setOpenMenuIDsPath: (): void => { },
    submenusPortalContainer: null,
    setSubmenusPortalContainer: (): void => { },
    pendingFocusSubmenuID: null,
    setPendingFocusSubmenuID: (): void => { }
};

export const mockDropdownMenuStoreContextValue: DropdownMenuStoreContextType = {
    getInitialState: () => mockDropdownMenuStore,
    getState: () => mockDropdownMenuStore,
    setState: () => { },
    subscribe: () => () => { }
};
