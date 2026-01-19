import {
    type PropsWithChildren
} from "react";

import {
    useDropdownItemSlotsContext
} from "../model/DropdownItemSlotsContext";

import { useSlot } from "../hooks/useSlot";

type DropdownItemLabelProps = PropsWithChildren;

export function DropdownItemLabel(
    { children }: DropdownItemLabelProps
): null {
    const { setLabel } = useDropdownItemSlotsContext();

    useSlot(setLabel, children);

    return null;
}
