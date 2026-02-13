import {
    type PropsWithChildren
} from "react";

import {
    useDropdownItemSlotsContext
} from "../hooks/useDropdownItemSlotsContext";

import { dropdownItemLabelLogger as logger } from "../utils/loggers";

/**
 * Props for the `DropdownItemLabel` component.
 *
 * @public
 */
export type DropdownItemLabelProps = PropsWithChildren;

/**
 * A dropdown item label component that is used to set the label of a dropdown
 * item when it is used as a child of a `DropdownItem`.
 *
 * @param props - An object containing:
 * - `children` - The content of the label, which can be any React node.
 *
 * @public
 */
export function DropdownItemLabel(
    { children }: DropdownItemLabelProps
): null {

    logger.debug("render; children:\n", children);

    useDropdownItemSlotsContext({
        setLabel: children
    });

    return null;
}

// use any to exclude from the generated .d.ts file
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
(DropdownItemLabel as any).displayName = "DropdownItemLabel";
