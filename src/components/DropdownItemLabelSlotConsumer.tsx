import {
    type ReactNode,
    memo
} from "react";

import {
    useStore
} from "zustand";

import {
    useDropdownItemSlotsStoreContext
} from "../model/store/DropdownItemSlotsStore";

/**
 * A component that consumes the `label` slot from the dropdown item slots store
 * context and renders it. This is used internally by the `DropdownItem`
 * component to render the label of the dropdown item.
 *
 * The purpose of extracting this into a separate component is to avoid
 * unnecessary re-renders of the entire `DropdownItem` component when the label
 * slot content changes.
 *
 * This is memoized because the client could pass in arbitrarily complex JSX for
 * the label.
 */
export const DropdownItemLabelSlotConsumer = memo(
    function DropdownItemLabelSlotConsumer(): ReactNode {

        const dropdownItemSlotsStoreContext = useDropdownItemSlotsStoreContext();

        const label = useStore(
            dropdownItemSlotsStoreContext,
            (state) => state.label
        );

        return label;

    }
);

DropdownItemLabelSlotConsumer.displayName = "DropdownItemLabelSlotConsumer";
