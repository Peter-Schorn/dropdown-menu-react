import {
    type PropsWithChildren
} from "react";

import {
    useDropdownItemSlotsContext
} from "../model/DropdownItemSlotsContext";

import { useSlot } from "../hooks/useSlot";

type DropdownItemSubmenuProps = PropsWithChildren;

export function DropdownItemSubmenu(
    { children }: DropdownItemSubmenuProps
): null {
    const { setSubmenu } = useDropdownItemSlotsContext();

    useSlot(setSubmenu, children);

    return null;
}
