import {
    createContext,
} from "react";


export type DisclosureIndicatorContextType = {
    submenuIsOpen: boolean;
};

export const DisclosureIndicatorContext =
    createContext<DisclosureIndicatorContextType>({
        submenuIsOpen: false
    });
