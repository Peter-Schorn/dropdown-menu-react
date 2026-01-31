import {
    type PropsWithChildren
} from "react";

import {
    useDropdownItemSlotsContext
} from "../model/DropdownItemSlotsContext";

import { useSlot } from "../hooks/useSlot";

export type DropdownItemLabelProps = PropsWithChildren;

export function DropdownItemLabel(
    { children }: DropdownItemLabelProps
): null {
    const { setLabel } = useDropdownItemSlotsContext();

    useSlot(
        { setter: setLabel, value: children }
    );

    return null;
}

DropdownItemLabel.displayName = "DropdownItemLabel";
