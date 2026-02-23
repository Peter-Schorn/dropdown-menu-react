import {
    type PropsWithChildren,
    type ReactNode,
    memo,
    useContext,
    useLayoutEffect
} from "react";

import { createPortal } from "react-dom";

import {
    useStore
} from "zustand";

import {
    useDropdownMenuStoreContext
} from "../model/store/DropdownMenuStore";

import {
    DropdownSubmenuContext
} from "../model/context/DropdownSubmenuContext";

import {
    useDropdownSubmenuStoreContext
} from "../model/store/DropdownSubmenuStore";

import {
    DropdownMenuCore
} from "./DropdownMenuCore";

import {
    CustomScrollbar
} from "./CustomScrollbar";

import { dropdownItemSubmenuLogger as logger } from "../utils/loggers";

/**
 * Props for the {@link DropdownItemSubmenu} component.
 *
 * @public
 */
export type DropdownItemSubmenuProps = PropsWithChildren;

/**
 * A dropdown item submenu component that is used to set the submenu of a
 * dropdown item when it is used as a child of a {@link DropdownItem}. The
 * submenu content should consist primarily of {@link DropdownItem} components,
 * but can also include other components, such as {@link DropdownDivider}.
 *
 * @param props - An object containing:
 * - `children` - The content of the submenu, which can be any React node but
 *   will typically consist of {@link DropdownItem} components.
 *
 * @public
 */
export const DropdownItemSubmenu = memo(function DropdownItemSubmenuMemo(
    props: DropdownItemSubmenuProps
): ReactNode {

    const {
        children
    } = props;

    const {
        dropdownMenuMeasuringContainerRef,
        dropdownMenuRef,
        dropdownMenuContentRef,
        dropdownMenuCoreRef,
        customScrollbarRef
    } = useContext(DropdownSubmenuContext);

    // MARK: Submenu Store
    const dropdownSubmenuStoreContext = useDropdownSubmenuStoreContext();

    const submenuID = useStore(
        dropdownSubmenuStoreContext,
        (state) => state.submenuID
    );

    const scrollbarHitbox = useStore(
        dropdownSubmenuStoreContext,
        (state) => state.scrollbarHitbox
    );

    const setScrollbarHitbox = useStore(
        dropdownSubmenuStoreContext,
        (state) => state.setScrollbarHitbox
    );

    // MARK: Menu Store
    const dropdownMenuStoreContext = useDropdownMenuStoreContext();

    const submenuIsOpen: boolean = useStore(
        dropdownMenuStoreContext,
        (state) => {
            return state.openMenuIDsPath.includes(submenuID);
        }
    );

    const submenusPortalContainer = useStore(
        dropdownMenuStoreContext,
        (state) => state.submenusPortalContainer
    );

    const zIndex: number = useStore(
        dropdownMenuStoreContext,
        (state) => {
            const isOpen = state.openMenuIDsPath.includes(submenuID);
            if (isOpen) {
                const openMenuIds = state.openMenuIDsPath;
                const index = openMenuIds.indexOf(submenuID);
                const zIndex = 10 + index * 2;
                return zIndex;
            }
            else {
                // default z-index for closed submenu
                return 10;
            }
        }
    );
    // const zIndex = 10;

    logger.debug(
        `render: submenuID: ${submenuID}; submenuIsOpen: ${submenuIsOpen}`
    );

    // MARK: useLayoutEffect: Set isSubmenu to true
    useLayoutEffect(() => {
        // the DropdownItemLabel and DropdownItem subscribe to this value to
        // determine whether they have a submenu
        dropdownSubmenuStoreContext.getState().setIsSubmenu(true);

    }, [
        dropdownSubmenuStoreContext
    ]);

    return (
        // WebKit (Safari) clips the submenu to the parent element when the
        // parent is scrollable. Also, even on non-WebKit browsers, the
        // submenu does not move up and down with the page when it is rubber
        // band scrolling if it is inside the dropdownItemContainer.
        createPortal((
            // the measuring container is necessary so that the width of
            // the scroll bar can be measured
            <div
                className="bd-dropdown-menu-measuring-container"
                ref={dropdownMenuMeasuringContainerRef}
                role="menu"
                data-submenu-id={submenuID}
                style={{
                    zIndex
                }}
            >
                <div
                    className="bd-dropdown-menu bd-dropdown-submenu"
                    ref={dropdownMenuRef}
                    data-submenu-id={submenuID}
                >
                    <DropdownMenuCore
                        isOpen={submenuIsOpen}
                        handle={dropdownMenuCoreRef}
                        dropdownMenuRef={dropdownMenuRef}
                        dropdownMenuContentRef={dropdownMenuContentRef}
                    >
                        {children}
                    </DropdownMenuCore>
                </div>
                <CustomScrollbar
                    scrollContainerIsVisible={submenuIsOpen}
                    handle={customScrollbarRef}
                    scrollContainerWrapperRef={
                        dropdownMenuMeasuringContainerRef
                    }
                    scrollContainerRef={dropdownMenuRef}
                    scrollbarHitbox={scrollbarHitbox}
                    setScrollbarHitbox={setScrollbarHitbox}
                    zIndex={zIndex}
                />
            </div>
        ),
            submenusPortalContainer
        )
    );

}
);

DropdownItemSubmenu.displayName = "DropdownItemSubmenu";
