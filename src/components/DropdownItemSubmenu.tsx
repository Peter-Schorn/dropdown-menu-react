import {
    type PropsWithChildren
} from "react";

import {
    useDropdownItemSlotsContext
} from "../model/DropdownItemSlotsContext";

import {
    useSlot
} from "../hooks/useSlot";

export type DropdownItemSubmenuProps = PropsWithChildren<{
    submenuID?: string;
}>;

export function DropdownItemSubmenu(
    {
        children,
        submenuID
    }: DropdownItemSubmenuProps
): null {

    const {
        setSubmenu,
        setSubmenuID
    } = useDropdownItemSlotsContext();

    useSlot(
        { setter: setSubmenu, value: children },
        submenuID ? { setter: setSubmenuID, value: submenuID } : null
    );

    return null;
}

DropdownItemSubmenu.displayName = "DropdownItemSubmenu";
