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
 * A component that consumes the `submenu` slot from the dropdown item slots
 * store context and renders it. This is used internally by the `DropdownItem`
 * component to render the label of the dropdown item.
 *
 * The purpose of extracting this into a separate component is to avoid
 * unnecessary re-renders of the entire `DropdownItem` component when the
 * submenu slot content changes.
 *
 * This is memoized because the client could pass in arbitrarily complex JSX for
 * the submenu.
 */
export const DropdownItemSubmenuSlotConsumer = memo(
    function DropdownItemSubmenuSlotConsumer(): ReactNode {

        const dropdownItemSlotsStoreContext = useDropdownItemSlotsStoreContext();

        const submenu = useStore(
            dropdownItemSlotsStoreContext,
            (state) => state.submenu
        );

        return submenu;

    }
);

DropdownItemSubmenuSlotConsumer.displayName = "DropdownItemSubmenuSlotConsumer";
