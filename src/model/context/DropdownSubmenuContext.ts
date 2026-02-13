import {
    type RefObject,
    createContext
} from "react";

import {
    type CustomScrollbarHandle
} from "../../components/CustomScrollbar";

export type DropdownSubmenuContextType = {
    readonly parentMenuIsOpen: boolean;
    readonly parentDropdownMenuMeasuringContainerRef: RefObject<HTMLDivElement | null>;
    readonly customScrollbarRef: RefObject<CustomScrollbarHandle | null>;
    readonly scrollbarHitbox: HTMLDivElement | null;
};

export const DropdownSubmenuContext = createContext<DropdownSubmenuContextType>({
    parentMenuIsOpen: false,
    parentDropdownMenuMeasuringContainerRef: { current: null },
    customScrollbarRef: { current: null },
    scrollbarHitbox: null
});

// export const DropdownSubmenuContext =
//     createContext<DropdownSubmenuContextType>(null!);

DropdownSubmenuContext.displayName = "DropdownSubmenuContext";
