import {
    type RefObject,
    createContext
} from "react";

export type DropdownItemContextType = Readonly<{
    dropdownItemRef: RefObject<HTMLDivElement | null>;
}>;

export const dropdownItemContextDefaultValue: DropdownItemContextType = {
    dropdownItemRef: { current: null }
};

export const DropdownItemContext = createContext<DropdownItemContextType>(
    dropdownItemContextDefaultValue
);

DropdownItemContext.displayName = "DropdownItemContext";
