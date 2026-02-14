import {
    createContext,
    useContext
} from "react";

import {
    type StoreApi,
    createStore
} from "zustand";

import type {
    UpdateState
} from "../../types/misc";

import {
    arraysAreEqualShallow,
    getNextState
 } from "../../utils/MiscellaneousUtilities";

export type DropdownMenuStore = {
    openMenuIDsPath: readonly string[];
    setOpenMenuIDsPath: (path: UpdateState<readonly string[]>) => void;
};

export type DropdownMenuContext2Type = StoreApi<DropdownMenuStore>;

export function createDropdownMenuStore(): DropdownMenuContext2Type {
    return createStore<DropdownMenuStore>((set) => ({
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
        }
    }));
}

const DropdownMenuContext2 =
    createContext<DropdownMenuContext2Type | null>(null);

DropdownMenuContext2.displayName = "DropdownMenuContext2";

export function useDropdownMenuContext(): DropdownMenuContext2Type {
    const context = useContext(DropdownMenuContext2);
    if (!context) {
        throw new Error(
            "useDropdownMenuContext must be used within a " +
            "DropdownMenuContext2.Provider"
        );
    }
    return context;
}
