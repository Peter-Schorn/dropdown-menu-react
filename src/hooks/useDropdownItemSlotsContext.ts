import { useContext } from "react";

import {
    type DropdownItemSlotsContextType,
    DropdownItemSlotsContext
} from "../model/context/DropdownItemSlotsContext";

export type UseDropdownItemSlotsContextOptions = {
    componentName: string;
};

export function useDropdownItemSlotsContext(
    {
        componentName
    }: UseDropdownItemSlotsContextOptions
): DropdownItemSlotsContextType {

    const context = useContext(DropdownItemSlotsContext);

    if (!context) {
        throw new Error(
            `${componentName} must be used within DropdownItem`
        );
    }

    return context;

}
