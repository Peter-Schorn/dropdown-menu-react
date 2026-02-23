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

import { MenuItemNode } from "../MenuItemNode";

import type {
    UpdateState,
} from "../../types/misc";

import {
    arraysAreEqualShallow,
    getNextState
} from "../../utils/MiscellaneousUtilities";

export type RequiredDropdownMenuStoreProps = Readonly<{

    /**
     * The container element for the portals of all submenus.
     */
    submenusPortalContainer: HTMLDivElement;

}>;

export type DropdownMenuStoreProps = RequiredDropdownMenuStoreProps & Readonly<{
    /**
     * The path of open menu IDs, starting from the main dropdown menu and going
     * down the deepest open submenu.
     */
    openMenuIDsPath: readonly string[];

    /**
     * The ID of the dropdown item that should receive focus once its parent
     * menu opens.
     */
    pendingFocusSubmenuID: string | null;

    menuItemTree: MenuItemNode;
}>;

export type DropdownMenuStore = DropdownMenuStoreProps & Readonly<{

    setOpenMenuIDsPath: (path: UpdateState<readonly string[]>) => void;

    setSubmenusPortalContainer: (
        submenusPortalContainer: HTMLDivElement
    ) => void;

    setPendingFocusSubmenuID: (pendingFocusSubmenuID: string | null) => void;

    setMenuItemTree: (menuItemTree: MenuItemNode) => void;
}>;

export type DropdownMenuStoreContextType = Mutate<
    StoreApi<DropdownMenuStore>,
    [["zustand/subscribeWithSelector", never]]
>;

export type CreateDropdownMenuStoreProps =
    RequiredDropdownMenuStoreProps &
    Partial<DropdownMenuStoreProps>;

function createDropdownMenuStore(
    props: CreateDropdownMenuStoreProps
): DropdownMenuStoreContextType {
    return createStore<DropdownMenuStore>()(subscribeWithSelector((set) => ({

        openMenuIDsPath: props.openMenuIDsPath ?? [],
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

        submenusPortalContainer: props.submenusPortalContainer,
        setSubmenusPortalContainer: (
            submenusPortalContainer: HTMLDivElement
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

        pendingFocusSubmenuID: props.pendingFocusSubmenuID ?? null,
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

        menuItemTree: props.menuItemTree ?? new MenuItemNode({ id: "" }),
        setMenuItemTree: (menuItemTree: MenuItemNode): void => {
            set((state) => {
                if (state.menuItemTree === menuItemTree) {
                    return state;
                }
                return {
                    menuItemTree
                };
            });
        }

    })));
}

/**
 * Creates and returns a new dropdown menu store instance that is stored in
 * react state. This should only be used once per dropdown menu (i.e. per
 * `DropdownMenu` component instance).
 */
export function useCreateDropdownMenuStore(
    props: CreateDropdownMenuStoreProps
): DropdownMenuStoreContextType {
    return useState(() => createDropdownMenuStore(props))[0];
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

export const mockSubmenusPortalContainer = ((): HTMLDivElement => {
    const container = document.createElement("div");
    container.className = "bd-submenus-portal-container";
    return container;
})();

export const mockDropdownMenuStore: DropdownMenuStore = {
    openMenuIDsPath: [],
    setOpenMenuIDsPath: (): void => { },
    submenusPortalContainer: mockSubmenusPortalContainer,
    setSubmenusPortalContainer: (): void => { },
    pendingFocusSubmenuID: null,
    setPendingFocusSubmenuID: (): void => { },
    menuItemTree: new MenuItemNode({ id: "" }),
    setMenuItemTree: (): void => { }
};

export const mockDropdownMenuStoreContextValue: DropdownMenuStoreContextType = {
    getInitialState: () => mockDropdownMenuStore,
    getState: () => mockDropdownMenuStore,
    setState: () => { },
    subscribe: () => () => { }
};
