import {
    type JSX,
    type ReactNode,
    type PropsWithChildren,
    memo,
    useContext
} from "react";

import {
    useStore
} from "zustand";

import { DropdownMenuCore } from "./DropdownMenuCore";
import { CustomScrollbar } from "./CustomScrollbar";

import {
    DropdownContext
} from "../model/context/DropdownContext";

import {
    DropdownOpenContext
} from "../model/context/DropdownOpenContext";

import {
    useDropdownSubmenuStoreContext
} from "../model/store/DropdownSubmenuStore";

/**
 * The props for the `DropdownMenu` component.
 *
 * @public
 */
export type DropdownMenuProps = PropsWithChildren;

const _DropdownMenu = memo(function DropdownMenuMemo(
    {
        children
    }: DropdownMenuProps
): JSX.Element {

    const dropdownOpenContext = useContext(DropdownOpenContext);

    const {
        isOpen
    } = dropdownOpenContext;

    const dropdownSubmenuStoreContext = useDropdownSubmenuStoreContext();

    const scrollbarHitbox = useStore(
        dropdownSubmenuStoreContext,
        (state) => state.scrollbarHitbox
    );

    const setScrollbarHitbox = useStore(
        dropdownSubmenuStoreContext,
        (state) => state.setScrollbarHitbox
    );

    const dropdownContext = useContext(DropdownContext);

    const {
        dropdownMenuCoreRef,
        dropdownMenuRef,
        dropdownMenuContentRef,
        customScrollbarRef,
        dropdownMenuMeasuringContainerRef
    } = dropdownContext;

    return (
        // the measuring container is necessary so that the width of the scroll
        // bar can be measured
        <div
            className="bd-dropdown-menu-measuring-container"
            ref={dropdownMenuMeasuringContainerRef}
        >
            <div
                className="bd-dropdown-menu"
                ref={dropdownMenuRef}
            >
                <DropdownMenuCore
                    isOpen={isOpen}
                    handle={dropdownMenuCoreRef}
                    dropdownMenuRef={dropdownMenuRef}
                    dropdownMenuContentRef={dropdownMenuContentRef}
                >
                    {children}
                </DropdownMenuCore>
            </div>
            <CustomScrollbar
                scrollContainerIsVisible={isOpen}
                handle={customScrollbarRef}
                scrollContainerWrapperRef={
                    dropdownMenuMeasuringContainerRef
                }
                scrollContainerRef={dropdownMenuRef}
                scrollbarHitbox={scrollbarHitbox}
                setScrollbarHitbox={setScrollbarHitbox}
                zIndex={10}
            />
        </div>
    );

});

// use any to exclude from the generated .d.ts file
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
(_DropdownMenu as any).displayName = "DropdownMenu";

/**
 * The dropdown menu component that should be used as a child of `Dropdown`.
 * This component is responsible for rendering the dropdown menu and its
 * contents, which can include arbitrarily nested submenus. It should only be
 * used once per dropdown menu (i.e. per `Dropdown` component instance).
 *
 * @public
 */
export const DropdownMenu = _DropdownMenu as
    (props: DropdownMenuProps) => ReactNode;
