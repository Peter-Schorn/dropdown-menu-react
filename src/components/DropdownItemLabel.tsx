import {
    type PropsWithChildren,
    useLayoutEffect
} from "react";

import {
    useDropdownItemSlotsStoreContext
} from "../model/store/DropdownItemSlotsStore";

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

    const dropdownItemSlotsStoreContext = useDropdownItemSlotsStoreContext({
        componentName: "DropdownItemLabel"
    });

    useLayoutEffect(() => {

        dropdownItemSlotsStoreContext.getState().setLabel(children);

    }, [
        children,
        dropdownItemSlotsStoreContext
    ]);

    // use a separate effect for cleanup to prevent the label from being removed
    // and re-added to the store every time it changes.
    useLayoutEffect(() => {
        return (): void => {
            dropdownItemSlotsStoreContext.getState().setLabel(null);
        };
    }, [
        dropdownItemSlotsStoreContext
    ]);

    return null;
}

// use any to exclude from the generated .d.ts file
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
(DropdownItemLabel as any).displayName = "DropdownItemLabel";
