import {
    type PropsWithChildren
} from "react";

import {
    useDropdownItemSlotsContext
} from "../model/DropdownItemSlotsContext";

import {
    useSlot
} from "../hooks/useSlot";

/**
 * Props for the {@link DropdownItemSubmenu} component.
 *
 * @public
 */
export type DropdownItemSubmenuProps = PropsWithChildren<{
    /**
     * An optional ID for the submenu. If provided this can be used to
     * programmatically open and close the submenu using the `openSubmenu` and
     * `closeSubmenu` methods of {@link DropdownMenuHandle}.
     */
    submenuID?: string;
}>;

/**
 * A dropdown item submenu component that is used to set the submenu of a
 * dropdown item when it is used as a child of a {@link DropdownItem}. The
 * submenu content should consist primarily of {@link DropdownItem} components,
 * but can also include other components, such as {@link DropdownDivider}.
 *
 * @param props - An object containing:
 * - `children` - The content of the submenu, which can be any React node but
 *   will typically consist of {@link DropdownItem} components.
 * - `submenuID` - An optional ID for the submenu. If provided this can be used
 *   to programmatically open and close the submenu using the `openSubmenu` and
 *   `closeSubmenu` methods of {@link DropdownMenuHandle}.
 *
 * @public
 */
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

// use any to exclude from the generated .d.ts file
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
(DropdownItemSubmenu as any).displayName = "DropdownItemSubmenu";
