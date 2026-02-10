import type * as React from "react";

import {
    type JSX,
    type PropsWithChildren,
    type ReactNode,
    useRef,
    useContext,
    useEffect,
    useCallback,
    useState,
    useMemo,
    memo,
} from "react";

import { createPortal } from "react-dom";

import { DropdownMenuContext } from "../model/DropdownMenuContext";
import {
    type DropdownSubmenuContextType,
    DropdownSubmenuContext
} from "../model/DropdownSubmenuContext";
import {
    type DropdownItemSlotsContextType,
    DropdownItemSlotsContext
} from "../model/DropdownItemSlotsContext";

import {
    type DisclosureIndicatorContextType,
    DisclosureIndicatorContext
} from "../model/DisclosureIndicatorContext";

import {
    type DropdownMenuCoreHandle,
    DropdownMenuCore
} from "./DropdownMenuCore";

import {
    type DropdownMenuRepositionSubmenuEvent,
    DropdownMenuEventType
} from "../model/DropdownMenuEventEmitter";

import {
    type CustomScrollbarHandle,
    CustomScrollbar
} from "./CustomScrollbar";

import { useEffectEvent } from "../hooks/useEffectEvent";

// import {
//     useEffectDebug
// } from "../hooks/useEffectDebug";

// import {
//     useCallbackDebug
// } from "../hooks/useCallbackDebug";

import {
    DROPDOWN_IDEAL_MIN_WIDTH
} from "../utils/constants";

import { useDebugConfig } from "../hooks/useDebugConfig";

import {
    type HorizontalEdge,
    isWebkit,
    domRectsAreEqual,
    clamp,
    eventWithinDomRect
} from "../utils/MiscellaneousUtilities";

import { dropdownItemLogger as logger } from "../utils/loggers";

/**
 * Props for the {@link DropdownItem} component.
 *
 * @public
 */
export type DropdownItemProps = PropsWithChildren & {
    /**
     * A click handler for the dropdown item.
     */
    onClick?: (event: MouseEvent) => void;
};

// doc comments are on the exported `DropdownItem` component at the bottom, so
// that they are visible in the docs
const _DropdownItem = memo(function DropdownItem(
    props: DropdownItemProps
): JSX.Element {

    type ToggleSubmenuOptions = {
        updateContext?: boolean;
    };

    const POINTER_ENTER_EXIT_DELAY_MS = 200;
    // const POINTER_ENTER_EXIT_DELAY_MS = 1_000;

    const debugConfig = useDebugConfig();

    const {
        onClick,
        children
    } = props;

    // need to use individual properties of the context in dependency arrays
    // to avoid unnecessary re-renders
    const {
        // isOpen: dropdownMenuIsOpen,
        submenusPortalContainer,
        menuItemTreeRef,
        menuItemsAlignmentRef,
        mainDropdownMenuEventEmitter,
        scheduleDropdownMenuReposition,
        openSubmenu: contextOpenSubmenu,
        closeSubmenu: contextCloseSubmenu,
        openMenuIDsPath,
        hoveredMenuItem,
        setHoveredMenuItem,
        ignoreClicksUntilNextPointerDownRef,
        mouseHoverEvents,
        closeOnClickLeafItem
    } = useContext(DropdownMenuContext);

    const {
        parentMenuIsOpen,
        scrollbarHitbox: parentScrollbarHitbox,
        parentDropdownMenuMeasuringContainerRef
    } = useContext(DropdownSubmenuContext);

    const [label, setLabel] = useState<ReactNode | null>(null);
    const [submenu, setSubmenu] = useState<ReactNode | null>(null);

    const [submenuIsOpen, setSubmenuIsOpen] = useState(false);
    const [zIndex, setZIndex] = useState(10);

    const [
        scrollbarHitbox,
        setScrollbarHitbox
    ] = useState<HTMLDivElement | null>(null);

    const [
        dropdownItemSecondaryFocus,
        setDropdownItemSecondaryFocus
    ] = useState(false);

    const isSubmenu = useMemo((): boolean => {
        return submenu !== null && submenu !== undefined;
    }, [submenu]);

    const dropdownMenuMeasuringContainerRef = useRef<HTMLDivElement>(null);
    const dropdownMenuRef = useRef<HTMLDivElement>(null);
    const dropdownMenuContentRef = useRef<HTMLDivElement>(null);

    const dropdownItemContainerRef = useRef<HTMLButtonElement>(null);
    const dropdownItemRef = useRef<HTMLDivElement>(null);

    const dropdownMenuCoreRef = useRef<DropdownMenuCoreHandle | null>(null);

    const customScrollbarRef = useRef<CustomScrollbarHandle | null>(null);

    /**
     * Timeout ID for the pointer leave timeout that closes the submenu.
     */
    const pointerLeaveTimeoutRef = useRef<number | undefined>(undefined);

    /**
     * Timeout ID for the pointer enter timeout that opens the submenu.
     */
    const pointerEnterTimeoutRef = useRef<number | undefined>(undefined);

    /**
     * Offset of the dropdown item that opened this submenu within the parent
     * menu at the time the submenu was opened; used to maintain the position
     * of the submenu relative to the opening menu item as if the opening menu
     * item was not scrolled.
     */
    const dropdownItemOffsetInMenuAtOpenRef = useRef<number>(0);

    /**
     * The scroll top of the parent menu at the time this submenu was opened.
     *
     * Used to maintain the position of the submenu relative to the opening
     * menu item as if the parent menu was never scrolled after this submenu
     * opens.
     */
    const parentMenuScrollTopAtOpenRef = useRef<number>(0);

    /**
     * An internally generated unique identifier for this submenu. Used if no
     * external submenu ID is provided via the `DropdownItemSubmenu` slot
     * component.
     */
    const submenuIDDefault = useMemo<string>(
        () => crypto.randomUUID(),
        []
    );

    // The setter for this state is exposed via context to the
    // `DropdownItemSubmenu` slot component so external code can set the submenu
    // ID. If not set externally (`null`), we use our internally generated ID
    // (`submenuIDDefault`).
    const [submenuIDExternal, setSubmenuID] = useState<string | null>(
        submenuIDDefault
    );

    /** A unique identifier for this submenu. */
    const submenuID = submenuIDExternal ?? submenuIDDefault;

    const repositionSubmenuListenerIDRef = useRef<string | null>(null);

    /**
     * Used to ignore the initial callback from the ResizeObserver, which
     * occurs when the observer is first created. The useEffect that creates
     * the ResizeObserver will rerun when certain dependencies change, which
     * will recreate the ResizeObserver and trigger the initial callback even
     * if the size has not changed.
     */
    const ignoreInitialResizeObserverCallbackRef = useRef<boolean>(false);

    /**
     * The size of the dropdown menu measuring container.
     */
    const dropdownMenuMeasuringContainerSizeRef = useRef<DOMRect | null>(null);

    /**
     * The size of the dropdown menu content.
     */
    const dropdownMenuContentSizeRef = useRef<DOMRect | null>(null);

    // logger.debug(`render dropdown item submenu ID ${submenuID}`);

    /**
     * Whether or not the pointer is currently inside the dropdown item
     * container component tree, including portaled submenu children. Used to
     * manage the submenu open/close state.
     */
    const pointerIsOverDropdownItemContainerComponentTreeRef = useRef<boolean>(
        false
    );

    /**
     * Clears the hovered menu item if and only if this item is currently
     * hovered.
     */
    const unsetHoveredMenuItem = useEffectEvent((): void => {
        setHoveredMenuItem(item => {
            // logger.debug(
            //     "unsetHoveredMenuItem: " +
            //     `item: ${item}; submenuID: ${submenuID}; ` +
            //     `hoveredMenuItem: ${hoveredMenuItem}; ` +
            //     `item === submenuID: ${item === submenuID}`
            // );

            // only clear hover if this item is currently hovered
            if (item === submenuID) {
                return null;
            }
            // if some other item is hovered, do nothing
            return item;
        });
    });

    /**
     * Whether or not the event is within the dropdown item container rect.
     */
    const eventWithinDropdownItemContainerRect = useCallback((
        event: PointerEvent | React.PointerEvent
    ): boolean => {

        const dropdownItemContainer = dropdownItemContainerRef.current;

        if (!dropdownItemContainer) {
            logger.error(
                "eventWithinDropdownItemContainerRect: " +
                "dropdownItemContainer is null"
            );
            return false;
        }

        const dropdownItemContainerRect =
            dropdownItemContainer.getBoundingClientRect();

        // const eventWithinRectString =
        //     `${dropdownItemContainerRect.left} < x: ${event.clientX} ` +
        //     `< ${dropdownItemContainerRect.right}; ` +
        //     `${dropdownItemContainerRect.top} < y: ${event.clientY} ` +
        //     `< ${dropdownItemContainerRect.bottom}`;

        if (eventWithinDomRect(event, dropdownItemContainerRect)) {

            // logger.debug(
            //     "eventWithinDropdownItemContainerRect: true; " +
            //     eventWithinRectString
            // );
            return true;
        }
        else {
            // logger.debug(
            //     "eventWithinDropdownItemContainerRect: false; " +
            //     eventWithinRectString
            // );
            return false;
        }

    }, []);

    /**
     * Whether or not the event is within the dropdown item container or any of
     * its portaled submenu DOM elements that are currently open. Used to
     * determine whether to open/close the submenu on pointer events.
     *
     * @param knownOutsideDropdownItemContainerDOM - If true, skips checking
     * the dropdown item container DOM rect and only checks portaled submenus.
     */
    const eventWithinDropdownItemContainerComponentTreeRects = useCallback((
        event: PointerEvent | React.PointerEvent,
        knownOutsideDropdownItemContainerDOM = false
    ): boolean => {

        // When a pointerleave event fires, the browser has definitively
        // determined via hit-testing that the pointer has left this element.
        // However, due to subpixel rendering, slight overlaps in layout,
        // rounding, and other issues, event.clientX/Y may still fall inside
        // getBoundingClientRect(). If we only checked the bounding rect, we'd
        // incorrectly conclude the pointer is still inside and keep the submenu
        // open. But since pointerleave already fired, no further pointer events
        // will arrive to trigger a close, leaving the submenu stuck open.
        //
        // Therefore, for pointerleave events we trust the browser's hit-test
        // result and only check if the pointer moved into a related element
        // (scrollbar hitbox or child submenu) that should keep the submenu
        // open.
        if (
            !knownOutsideDropdownItemContainerDOM &&
            (
                (
                    // check if the pointer has left the dropdown item container
                    // but entered the scrollbar hitbox and is still within the
                    // bounds of the dropdown item container
                    event.relatedTarget instanceof HTMLElement &&
                    event.type === "pointerleave" &&
                    // relatedTarget is the element the pointer has moved into
                    // after leaving the current element. Check if it is the
                    // scrollbar hitbox.
                    event.relatedTarget.hasAttribute("data-scrollbar-hitbox")
                ) ||
                (
                    // check if the pointer has moved in/entered the scrollbar
                    // hitbox but is still within the bounds of the dropdown
                    // item container
                    event.target instanceof HTMLElement &&
                    event.target.hasAttribute("data-scrollbar-hitbox")
                )
            ) &&
            // check if the event is within the dropdown item container rect
            eventWithinDropdownItemContainerRect(event)
        ) {
            return true;
        }

        // check if the event is within any of the portaled submenu DOM elements
        // that are open and are children of this dropdown item
        const currentMenuIndex = openMenuIDsPath.indexOf(submenuID);
        if (currentMenuIndex < 0) {
            // this submenu is not in the `openMenuIDsPath`, so it is not open
            // in the first place
            return false;
        }
        const openSubmenus = openMenuIDsPath.slice(currentMenuIndex);

        for (const submenu of openSubmenus) {
            const submenuDropdownMenuMeasuringContainer =
                document.querySelector(
                    `.bd-dropdown-menu-measuring-container[data-submenu-id='${submenu}']`
                );
            if (!(submenuDropdownMenuMeasuringContainer instanceof HTMLElement)) {
                continue;
            }
            const submenuDropdownMenuMeasuringContainerRect =
                submenuDropdownMenuMeasuringContainer.getBoundingClientRect();
            if (
                eventWithinDomRect(
                    event,
                    submenuDropdownMenuMeasuringContainerRect
                )
            ) {
                logger.debug(
                    "eventWithinDropdownItemContainerComponentTree: " +
                    `event is within submenu '${submenu}' of dropdown item ` +
                    `with submenu ${submenuID}; returning true`
                );
                return true;
            }
        }
        return false;
    }, [
        eventWithinDropdownItemContainerRect,
        openMenuIDsPath,
        submenuID
    ]);

    function handleDropdownMenuClick(
        event: React.MouseEvent<HTMLDivElement, MouseEvent>
    ): void {
        logger.debug(
            "handleDropdownMenuClick: for submenu of dropdown item with " +
            `submenu ID ${submenuID}`
        );

        if (ignoreClicksUntilNextPointerDownRef.current) {
            ignoreClicksUntilNextPointerDownRef.current = false;
            logger.debug(
                "handleDropdownMenuClick: " +
                "ignoreClicksUntilNextPointerDownRef.current " +
                "is true; not handling click and stopping propagation"
            );
            event.stopPropagation();
            event.nativeEvent.stopImmediatePropagation();
            return;
        }

    }

    const handleDropdownItemContainerPointerDown = useEffectEvent((
        // event: React.PointerEvent<HTMLButtonElement>
    ): void => {
        logger.debug(
            "handleDropdownItemPointerDown: for dropdown item with submenu " +
            `ID ${submenuID}`
            /* , event */
        );

        ignoreClicksUntilNextPointerDownRef.current = false;

    });

    const getPreferredEdge = useCallback((): HorizontalEdge => {

        const menuItemTree = menuItemTreeRef.current;
        const parent = menuItemTree.parentOf(submenuID);
        if (!parent) {
            // this should never happen because the submenu should always at
            // least have the main dropdown menu as an ancestor
            logger.error(
                "getPreferredEdge: could not find parent of submenu with ID " +
                `${submenuID}; returning default edge: right`
            );
            return "right"; // default edge
        }

        const preferredEdge = menuItemsAlignmentRef.current.get(
            parent.id
        );

        if (!preferredEdge) {
            // this should never happen because the parent should always be open
            // and have a preferred edge set if this menu is open
            logger.error(
                "getPreferredEdge: no preferred edge set for parent with ID " +
                `${parent.id} of ${submenuID}; returning default edge: right`
            );
            return "right";
        }

        logger.debug(
            "getPreferredEdge: for dropdown item with submenu ID " +
            `${submenuID}; preferredEdge: ${preferredEdge}`
        );
        return preferredEdge;

    }, [
        menuItemTreeRef,
        menuItemsAlignmentRef,
        submenuID
    ]);

    const setAlignment = useCallback((
        alignment: HorizontalEdge
    ): void => {

        menuItemsAlignmentRef.current.set(
            submenuID,
            alignment
        );

        logger.debug(
            `setAlignment: set alignment of submenu with ID ${submenuID} ` +
            `to ${alignment}`
        );

    }, [
        menuItemsAlignmentRef,
        submenuID
    ]);

    const positionSubmenu = useCallback((): void => {

        const performanceMarkDetail = {
            submenuID: submenuID
        };

        performance.mark("position-submenu-start", {
            detail: performanceMarkDetail
        });

        logger.debug(
            "------ positionSubmenu: begin ------ " +
            `for dropdown item with submenu ID ${submenuID}`
        );

        /**
         * The dropdown menu element; it has the scrollbars if the content
         * overflows.
         */
        const dropdownMenu = dropdownMenuRef.current;
        if (!dropdownMenu) {
            logger.warn(
                "positionSubmenu: dropdownMenu is null"
            );
            return;
        }

        /**
         * The dropdown menu content element.
         */
        const dropdownMenuContent = dropdownMenuContentRef.current;
        if (!dropdownMenuContent) {
            logger.warn(
                "positionSubmenu: dropdownMenuContent is null"
            );
            return;
        }

        /**
         * The first dropdown item container element inside the submenu; used to
         * align the parent menu item with this submenu item.
         */
        const firstSubmenuDropdownItem = dropdownMenuContent.querySelector(
            ".bd-dropdown-item-container"
        );

        if (!(firstSubmenuDropdownItem instanceof HTMLElement)) {
            logger.warn(
                "positionSubmenu: firstSubmenuDropdownItemContainer is null"
            );
            return;
        }

        /**
         * The dropdown menu measuring container element.
         */
        const dropdownMenuMeasuringContainer = dropdownMenuMeasuringContainerRef.current;
        if (!dropdownMenuMeasuringContainer) {
            logger.warn(
                "positionSubmenu: dropdownMenuMeasuringContainer is null"
            );
            return;
        }

        /**
         * The menu item (nested in the parent menu) that opens the
         * dropdown sub-menu.
         */
        const dropdownItem = dropdownItemRef.current;
        if (!dropdownItem) {
            logger.warn(
                "positionSubmenu: dropdownItem is null"
            );
            return;
        }


        /** The parent dropdown menu measuring container. */
        const parentMenuMeasuringContainer =
            parentDropdownMenuMeasuringContainerRef.current;

        if (!parentMenuMeasuringContainer) {
            logger.error(
                "positionSubmenu: could not find parent menu measuring " +
                `container for dropdown item with submenu ID ${submenuID}`
            );
            return;
        }

        /** The parent dropdown menu. */
        const parentMenu = parentMenuMeasuringContainer.querySelector(
            ".bd-dropdown-menu"
        );
        if (!(parentMenu instanceof HTMLElement)) {
            logger.error(
                "positionSubmenu: could not find parent menu for " +
                `dropdown item with submenu ID ${submenuID}`
            );
            return;
        }

        const preferredEdge = getPreferredEdge();

        // const { scrollX, scrollY } = getWindowScroll();
        // fixes rubber-banding issue on iOS Safari
        const { scrollX, scrollY } = window;

        const vOffsetTop = visualViewport?.offsetTop ?? 0;
        const vOffsetLeft = visualViewport?.offsetLeft ?? 0;
        const visibleWidth = visualViewport?.width ?? window.innerWidth;
        const visibleHeight = visualViewport?.height ?? window.innerHeight;

        const verticalPadding = visibleHeight * 0.01;
        const horizontalPadding = visibleWidth * 0.01;
        // const verticalPadding = 0;
        // const horizontalPadding = 0;

        // /** The parent dropdown menu measuring container rect. */
        // const parentMenuRect = parentMenu.getBoundingClientRect();

        // logger.debug(
        //     "positionSubmenu: isWebkit:", isWebkit
        // );

        /** The parent dropdown menu measuring container rect. */
        const parentMenuMeasuringContainerRect =
            parentMenuMeasuringContainer.getBoundingClientRect();

        /**
         * The menu item (nested in the parent menu) that opens the dropdown
         * sub-menu.
         */
        const dropdownItemRect = dropdownItem.getBoundingClientRect();

        // we must get the bounding rect after setting the position
        /** The dropdown menu measuring container rect. */
        let dropdownMenuRect = dropdownMenuMeasuringContainer.getBoundingClientRect();

        /** The actual dropdown menu rect (not measuring container) */
        const dropdownMenuActualRect = dropdownMenu.getBoundingClientRect();

        /** The dropdown menu content rect */
        const dropdownMenuContentRect = dropdownMenuContent.getBoundingClientRect();

        /**
         * The top padding between the top of the dropdown menu and the top of
         * the dropdown menu container. Reflects the top padding inside the
         * dropdown menu container.
         */
        const dropdownMenuContainerTopPadding = Math.round(
            dropdownMenuActualRect.top - dropdownMenuRect.top
        );

        /**
         * The vertical padding inside the dropdown menu container: Reflects
         * the difference between the height of the dropdown menu measuring
         * container and the height of the dropdown menu content.
         */
        const dropdownMenuContainerVerticalPadding =
            dropdownMenuContainerTopPadding * 2;

        /**
         * The first dropdown item container element inside the submenu; used to
         * align the parent menu item with this submenu item.
         */
        const firstSubmenuDropdownItemRect =
            firstSubmenuDropdownItem.getBoundingClientRect();


        // logger.debug(
        //     "positionSubmenu: dropdownItemContainer element:", dropdownItemContainer,
        //     "\ndropdownItemRect:", dropdownItemRect,
        //     "\ndropdownMenuRect:", dropdownMenuRect,
        //     "\nwindow.innerWidth:", window.innerWidth,
        //     "\nwindow.innerHeight:", window.innerHeight,
        //     "\nscrollX:", scrollX,
        //     "\nscrollY:", scrollY,
        //     "\nvisualViewport:", visualViewport,
        //     "\nvisibleWidth:", visibleWidth,
        //     "\nvisibleHeight:", visibleHeight,
        //     "\nvOffsetTop:", vOffsetTop,
        //     "\nvOffsetLeft:", vOffsetLeft,
        // );


        // MARK: - Vertical Positioning -
        // #region vertical-positioning

        /** The top of the visual viewport (plus padding) */
        let visualTopEdge: number;

        /** The bottom of the visual viewport (minus padding) */
        let visualBottomEdge: number;

        if (isWebkit) {
            // is Safari

            // calculate visual viewport bounds in page coordinates (Safari)
            visualTopEdge = scrollY + verticalPadding;
            visualBottomEdge = scrollY + visibleHeight - verticalPadding;
        }
        else {
            // is Chrome

            // calculate visual viewport bounds in page coordinates
            visualTopEdge = scrollY + vOffsetTop + verticalPadding;
            visualBottomEdge = scrollY + vOffsetTop + visibleHeight - verticalPadding;
        }


        // the height of the dropdown menu content if there were no scrollbars:
        // the height of the menu (plus measuring container vertical padding or
        // not?)
        /**
         * The height of the dropdown menu content including the vertical
         * padding of the dropdown menu container. Represents the total height
         * that would be needed to display the entire dropdown menu.
         */
        const dropdownMenuContentHeight = dropdownMenuContentRect.height
            + dropdownMenuContainerVerticalPadding;

        /** The height of the viewport, minus padding. */
        const viewportHeight = visualBottomEdge - visualTopEdge;

        // cap the submenu height so it can always fit inside the visual
        // viewport

        /** The maximum height that does not exceed the viewport height. */
        const maxAllowedHeight = Math.max(0, viewportHeight);

        /**
         * The maximum height necessary for the entire menu to be visible
         * without scrolling, capped at the maximum height that fits within the
         * visual viewport.
         */
        const constrainedHeight = Math.min(
            dropdownMenuContentHeight,
            maxAllowedHeight
        );

        // try to align submenu top with the opener item, but clamp within
        // bounds

        if (parentMenu.scrollHeight === parentMenu.clientHeight) {
            // parent menu is not scrollable; no need to account for scroll
            // offset, and reset to zero

            logger.debug(
                "positionSubmenu: parent menu is not scrollable; resetting" +
                "parentMenuScrollTopAtOpenRef to 0 and recalculating " +
                "dropdownItemOffsetInMenuAtOpenRef"
            );

            parentMenuScrollTopAtOpenRef.current = 0;

            dropdownItemOffsetInMenuAtOpenRef.current =
                dropdownItemRect.top
                - parentMenuMeasuringContainerRect.top;
        }

        /**
         * The offset from the top of the dropdown menu measuring container to
         * the top of the first dropdown item; used to align the submenu item
         * with the parent menu item.
         */
        const firstSubmenuDropdownItemOffsetTop =
            firstSubmenuDropdownItemRect.top - dropdownMenuContentRect.top +
            dropdownMenuContainerTopPadding;


        /**
         * The maximum scroll top of the parent menu at the current time.
         */
        const maxScrollTopNow = Math.max(
            0,
            parentMenu.scrollHeight - parentMenu.clientHeight
        );


        /**
         * The effective scroll top of the parent menu at the time of opening,
         * capped to the maximum scroll top of the parent menu at the current
         * time.
         */
        const effectiveScrollTop = Math.min(
            parentMenuScrollTopAtOpenRef.current,
            maxScrollTopNow
        );

        /**
         * The ideal top of the menu: The top of the opening parent menu item
         * aligns with the first submenu item.
         */
        // MARK: Theoretical Ideal Top
        const theoreticalIdealTop =
            parentMenuMeasuringContainerRect.top
            + scrollY
            + (dropdownItemOffsetInMenuAtOpenRef.current - effectiveScrollTop)
            - firstSubmenuDropdownItemOffsetTop;

        // old version that does not ignore parent menu scrolling after open
        // const theoreticalIdealTopOld = dropdownItemRect.top + scrollY
        //     - firstSubmenuDropdownItemOffsetTop;

        /**
         * Align the submenu as if the parent menu item was at the very top of
         * its scrollport.
         */
        const minIdealTop = parentMenuMeasuringContainerRect.top + scrollY;

        /**
         * Should be the offset from the bottom of the last menu item in the
         * parent menu to the bottom of the parent menu, assuming the content
         * was not clipped.
         *
         * We use firstSubmenuDropdownItemOffsetTop because it should be the
         * same due to the fact that all menus have the same vertical padding.
         */
        const parentMenuItemOffsetBottom = firstSubmenuDropdownItemOffsetTop;

        /**
         * Align the submenu as if the parent menu item was at the very bottom
         * of its scrollport.
         */
        const maxIdealTop = parentMenuMeasuringContainerRect.bottom + scrollY
            - dropdownItemRect.height
            // take into account the offset from the bottom of the parent menu
            // item to the bottom of the parent menu as well as the offset from
            // the top of the submenu to the first submenu item
            - parentMenuItemOffsetBottom * 2;

        /**
         * Constrain the ideal top offset of the menu to be within the bounds of
         * the parent menu, in case the parent menu item was scrolled out of
         * view.
         */
        const idealTop = clamp(theoreticalIdealTop, {
            min: minIdealTop,
            max: maxIdealTop
        });

        // const idealTop = minIdealTop;
        // const idealTop = theoreticalIdealTop;
        // const idealTop = maxIdealTop;

        /**
         * The lowest top position (highest on the screen) the menu can have
         * without overflowing the top of the visual viewport (plus padding).
         */
        const minTop = visualTopEdge;

        /** The bottom of the visual viewport (minus padding) */

        /**
         * The highest top position (lowest on the screen) the menu can have
         * without overflowing the bottom of the visual viewport (minus
         * padding).
         */
        const maxTop = Math.max(
            visualBottomEdge - constrainedHeight,
            minTop
        );

        const dropdownMenuTop = clamp(idealTop, { min: minTop, max: maxTop });

        dropdownMenuMeasuringContainer.style.top = `${dropdownMenuTop}px`;

        /**
         * The distance between the top of the menu (that was just set above)
         * and the bottom of the visual viewport: The maximum space available
         * for the menu below its top edge.
         */
        const availableHeight = Math.max(0, visualBottomEdge - dropdownMenuTop);

        /**
         * The maximum height to set on the dropdown menu to ensure it fits
         * within the visual viewport given the location of the top of the
         * dropdown menu.
         */
        const maxHeight = Math.min(
            availableHeight,
            maxAllowedHeight
        );

        dropdownMenuMeasuringContainer.style.maxHeight = `${maxHeight}px`;

        logger.debug(
            "positionSubmenu: vertical positioning: " +
            `dropdownMenuContainerVerticalPadding: ${dropdownMenuContainerVerticalPadding}; ` +
            `dropdownMenuContentHeight: ${dropdownMenuContentHeight}; ` +
            `idealTop: ${idealTop}; minTop: ${minTop}; maxTop: ${maxTop}; ` +
            `dropdownMenuTop: ${dropdownMenuTop}; ` +
            `availableHeight: ${availableHeight}; maxHeight: ${maxHeight}`
        );


        // MARK: - End Vertical Positioning -
        // #endregion vertical-positioning

        // MARK: Set max width of dropdown menu to fit within visible viewport
        const maxWidth = visibleWidth - horizontalPadding * 2;
        const minWidth = Math.min(DROPDOWN_IDEAL_MIN_WIDTH, maxWidth);
        dropdownMenuMeasuringContainer.style.maxWidth = `${maxWidth}px`;
        dropdownMenuMeasuringContainer.style.minWidth = `${minWidth}px`;

        // notify custom scroll bar of geometry change after vertical
        // positioning because that may have changed the height of the scroll
        // container, which the scroll bar relies on, but before horizontal
        // positioning because the appearance of a scrollbar may change the
        // width of the scroll container, which itself affects horizontal
        // positioning of this menu
        customScrollbarRef.current?.scheduleGeometryUpdate({
            // this callee is already batched to animation frames and we need
            // an update immediately anyway because the horizontal positioning
            // logic below relies on up-to-date geometry
            batchToAnimationFrame: false,
            // We will call `repositionScrollbarHitbox` after updating the
            // horizontal position. If we did it here, the hitbox would be
            // repositioned based on the old horizontal position, which may
            // lead to it lagging behind the position of the actual scrollbar.
            repositionScrollbarHitbox: false
        });


        // after vertical positioning, the width may have changed due to
        // scrollbar appearance/disappearance
        dropdownMenuRect = dropdownMenuMeasuringContainer.getBoundingClientRect();

        // MARK: - Horizontal Positioning -

        // MARK: Check if submenu would overflow right side of *VISUAL* viewport
        let overflowsVisualViewportRight: boolean;

        let visibleRightEdge: number;

        if (isWebkit) {
            // is Safari
            visibleRightEdge = visibleWidth;
        }
        else {
            // is Chrome
            visibleRightEdge = visibleWidth + vOffsetLeft;
        }


        /**
         * The right edge of this submenu if it were ideally positioned to
         * the right of the parent menu.
         */
        const dropdownMenuIdealRightEdge = dropdownItemRect.right
            + dropdownMenuRect.width;

        if (dropdownMenuIdealRightEdge + horizontalPadding > visibleRightEdge) {
            overflowsVisualViewportRight = true;
        }
        else {
            overflowsVisualViewportRight = false;
        }

        logger.debug(
            "positionSubmenu: dropdownMenuRect:", dropdownMenuRect,
            `\nidealRightEdge: ${dropdownMenuIdealRightEdge}; ` +
            `visibleRightEdge: ${visibleRightEdge}; ` +
            `overflowsVisualViewportRight: ${overflowsVisualViewportRight}`
        );


        // MARK: Check if submenu would overflow left side of *VISUAL* viewport
        let overflowsVisualViewportLeft: boolean;

        let visibleLeftEdge: number;

        if (isWebkit) {
            // is Safari
            visibleLeftEdge = horizontalPadding;
        }
        else {
            // is Chrome
            visibleLeftEdge = vOffsetLeft + horizontalPadding;
        }

        /**
         * The left edge of this submenu if it were ideally positioned to
         * the left of the parent menu.
         */
        const dropdownMenuIdealLeftEdge = dropdownItemRect.left
            - dropdownMenuRect.width;

        if (visibleLeftEdge > dropdownMenuIdealLeftEdge) {
            overflowsVisualViewportLeft = true;
        }
        else {
            overflowsVisualViewportLeft = false;
        }

        // logger.debug(
        //     `positionSubmenu: idealLeftOffset: ${idealLeftOffset}; ` +
        //     `visibleLeftEdge: ${visibleLeftEdge}; ` +
        //     `overflowsVisualViewportLeft: ${overflowsVisualViewportLeft}`
        // );


        // MARK: Determine Horizontal Alignment
        // #region determine-horizontal-alignment

        // Possible combinations:
        //
        // 1. preferredEdge: left, overflowsLeft: true, overflowsRight: true
        //     -> position on the side with more space
        //
        // 2. preferredEdge: left, overflowsLeft: true, overflowsRight: false
        //     -> position to the right of parent
        //
        // 3. preferredEdge: left, overflowsLeft: false, overflowsRight: true
        //     -> position to the left of parent (preferred)
        //
        // 4. preferredEdge: left, overflowsLeft: false, overflowsRight: false
        //     -> position to the left of parent (preferred)
        //
        // 5. preferredEdge: right, overflowsLeft: true, overflowsRight: true
        //     -> position on the side with more space
        //
        // 6. preferredEdge: right, overflowsLeft: true, overflowsRight: false
        //     -> position to the right of parent (preferred)
        //
        // 7. preferredEdge: right, overflowsLeft: false, overflowsRight: true
        //     -> position to the left of parent
        //
        // 8. preferredEdge: right, overflowsLeft: false, overflowsRight: false
        //     -> position to the right of parent (preferred)

        let alignment: HorizontalEdge;


        if (
            overflowsVisualViewportLeft &&
            overflowsVisualViewportRight
        ) {
            // MARK: Position on the side with more space
            logger.debug(
                "positionSubmenu: both edges overflow the viewport for " +
                `dropdown item with submenu ID ${submenuID}; ` +
                "positioning on side with more space"
            );

            /**
             * The distance from the left edge of the visual viewport to the
             * left edge of the dropdown item container.
             */
            let distanceToLeftEdge: number;

            /**
             * The distance from the right edge of the visual viewport to the
             * right edge of the dropdown item container.
             */
            let distanceToRightEdge: number;

            if (isWebkit) {
                // is Safari
                distanceToLeftEdge = dropdownItemRect.left;
                distanceToRightEdge = visibleWidth - dropdownItemRect.right;
            }
            else {
                // is Chrome
                distanceToLeftEdge = dropdownItemRect.left - vOffsetLeft;
                distanceToRightEdge = visibleWidth - dropdownItemRect.right
                    + vOffsetLeft;
            }

            // const leftLargest = distanceToLeftEdge > distanceToRightEdge;
            // const rightLargest = distanceToRightEdge > distanceToLeftEdge;

            // logger.debug(
            //     "positionSubmenu: " +
            //     `\ndistanceToLeftEdge: ${distanceToLeftEdge} (largest: ${leftLargest})` +
            //     `\ndistanceToRightEdge: ${distanceToRightEdge} (largest: ${rightLargest})`
            // );

            if (distanceToLeftEdge > distanceToRightEdge) {
                // position to the left of parent
                alignment = "left";
            }
            else /* if (distanceToRightEdge >= distanceToLeftEdge) */ {
                // position to the right of parent
                alignment = "right";
            }
        }
        else if (
            (
                preferredEdge === "right" &&
                !overflowsVisualViewportRight
            ) ||
            (
                preferredEdge === "left" &&
                overflowsVisualViewportLeft
            )
        ) {
            alignment = "right";
        }
        else if (
            (
                preferredEdge === "left" &&
                !overflowsVisualViewportLeft
            ) ||
            (
                preferredEdge === "right" &&
                overflowsVisualViewportRight
            )
        ) {
            alignment = "left";
        }
        else {
            // MARK: Unreachable; default to preferred edge
            logger.error(
                "positionSubmenu: (UNREACHABLE) could not determine " +
                "horizontal positioning for dropdown item with submenu ID " +
                `${submenuID}; defaulting to preferred edge`
            );
            alignment = preferredEdge;
        }

        setAlignment(alignment);
        // #endregion determine-horizontal-alignment

        if (alignment === "left") {
            // MARK: Position to the left of parent

            let minLeftOffset: number;

            if (isWebkit) {
                // is Safari
                minLeftOffset = scrollX + horizontalPadding;
            }
            else {
                // is Chrome
                minLeftOffset = scrollX + horizontalPadding + vOffsetLeft;
            }

            const idealLeftOffset = dropdownItemRect.left - 1
                - dropdownMenuRect.width + scrollX;

            const leftOffset = Math.max(
                idealLeftOffset,
                minLeftOffset
            );

            // MARK: Apply left positioning
            dropdownMenuMeasuringContainer.style.left = `${leftOffset}px`;

            logger.debug(
                "positionSubmenu: left alignment: " +
                "dropdownMenuMeasuringContainerRect:", dropdownMenuRect,
                `\nidealLeft: ${idealLeftOffset}; ` +
                `minLeft: ${minLeftOffset}; ` +
                `leftOffset: ${leftOffset}`
            );

        }
        else /* if (alignment === "right") */ {
            // MARK: Position to the right of parent

            let maxLeftOffset: number;

            if (isWebkit) {
                // is Safari
                maxLeftOffset = visibleWidth - dropdownMenuRect.width
                    + scrollX - horizontalPadding;
            }
            else {
                // is Chrome
                maxLeftOffset = visibleWidth - dropdownMenuRect.width
                    + scrollX + vOffsetLeft - horizontalPadding;
            }

            const idealLeftOffset = dropdownItemRect.right + 1 +
                scrollX;

            const leftOffset = Math.min(
                idealLeftOffset,
                maxLeftOffset
            );

            // MARK: Apply right positioning
            dropdownMenuMeasuringContainer.style.left = `${leftOffset}px`;
        }

        logger.debug(
            "positionSubmenu: dropdownMenuMeasuringContainer.style.left:",
            dropdownMenuMeasuringContainer.style.left,
            "\ndropdownMenuMeasuringContainer.style.top:",
            dropdownMenuMeasuringContainer.style.top
        );

        dropdownMenuCoreRef.current?.updateScrollProperties();

        customScrollbarRef.current?.repositionScrollbarHitbox();

        // ensure the resize observer does not trigger another invocation of
        // this method
        const measuringContainerNewSize =
            dropdownMenuMeasuringContainer.getBoundingClientRect();
        dropdownMenuMeasuringContainerSizeRef.current =
            measuringContainerNewSize;

        const contentNewSize =
            dropdownMenuContent.getBoundingClientRect();
        dropdownMenuContentSizeRef.current = contentNewSize;

        logger.debug(
            "------ positionSubmenu: end ------ " +
            `for dropdown item with submenu ID ${submenuID}`
        );

        performance.mark("position-submenu-end", {
            detail: performanceMarkDetail
        });

        performance.measure(
            "position-submenu",
            "position-submenu-start",
            "position-submenu-end"
        );

    }, [
        parentDropdownMenuMeasuringContainerRef,
        getPreferredEdge,
        setAlignment,
        submenuID
    ]);

    /**
     * Closes the submenu.
     *
     * @param options - An object containing:
     * - `updateContext`: If true, the openSubmenuID in the context will be set
     *   to null. If false, the openSubmenuID will not be set to null, allowing
     *   another submenu to be opened.
     */
    const closeSubmenu = useCallback((
        { updateContext = true }: ToggleSubmenuOptions = {}
    ): void => {

        if (!isSubmenu) {
            return;
        }

        if (!submenuIsOpen) {
            logger.debug(
                "closeSubmenu: submenu for dropdown item with submenu ID " +
                `${submenuID} is already closed`
            );
            return;
        }

        logger.debug(
            `closeSubmenu: for dropdown item with submenu ID ${submenuID}`
        );

        const dropdownMenuMeasuringContainer =
            dropdownMenuMeasuringContainerRef.current;
        if (
            !dropdownMenuMeasuringContainer
        ) {
            logger.debug(
                "closeSubmenu: dropdownMenu or dropdownItem or " +
                "dropdownMenuMeasuringContainer is null"
            );
            return;
        }

        setSubmenuIsOpen(false);

        // hide the submenu
        dropdownMenuMeasuringContainer.classList.remove(
            "bd-dropdown-menu-measuring-container-show"
        );

        clearTimeout(pointerLeaveTimeoutRef.current);
        clearTimeout(pointerEnterTimeoutRef.current);

        setDropdownItemSecondaryFocus(false);

        if (updateContext) {
            contextCloseSubmenu(submenuID);
        }

        setZIndex(10); // reset z-index to default

        menuItemsAlignmentRef.current.delete(
            submenuID
        );

        ignoreInitialResizeObserverCallbackRef.current = false;

        dropdownMenuMeasuringContainerSizeRef.current = null;
        dropdownMenuContentSizeRef.current = null;

    }, [
        contextCloseSubmenu,
        menuItemsAlignmentRef,
        isSubmenu,
        setDropdownItemSecondaryFocus,
        submenuID,
        submenuIsOpen
    ]);

    const openSubmenu = useCallback((
        { updateContext = true }: ToggleSubmenuOptions = {}
    ): void => {

        if (!isSubmenu) {
            return;
        }

        if (submenuIsOpen) {
            logger.debug(
                "openSubmenu: submenu for dropdown item with submenu ID " +
                `${submenuID} is already open`
            );
            return;
        }

        const dropdownItem = dropdownItemRef.current;
        const dropdownMenuMeasuringContainer =
            dropdownMenuMeasuringContainerRef.current;

        if (
            !dropdownItem ||
            !dropdownMenuMeasuringContainer
        ) {
            logger.debug(
                "openSubmenu: dropdownItem or " +
                "dropdownMenuMeasuringContainer is null"
            );
            return;
        }

        /** The parent dropdown menu measuring container. */
        const parentMenuMeasuringContainer = dropdownItem.closest(
            ".bd-dropdown-menu-measuring-container"
        );

        if (!(parentMenuMeasuringContainer instanceof HTMLElement)) {
            logger.error(
                "openSubmenu: could not find parent menu measuring container " +
                `for dropdown item with submenu ID ${submenuID}`
            );
            return;
        }

        /** The parent dropdown menu. */
        const parentMenu = parentMenuMeasuringContainer.querySelector(
            ".bd-dropdown-menu"
        );
        if (!(parentMenu instanceof HTMLElement)) {
            logger.error(
                "positionSubmenu: could not find parent menu for " +
                `dropdown item with submenu ID ${submenuID}`
            );
            return;
        }

        setSubmenuIsOpen(true);

        logger.debug(
            `openSubmenu: for dropdown item with submenu ID ${submenuID}`
        );

        clearTimeout(pointerLeaveTimeoutRef.current);
        clearTimeout(pointerEnterTimeoutRef.current);

        // scroll into view
        dropdownItem.scrollIntoView({
            block: "nearest",
            inline: "nearest"
        });

        const depth = menuItemTreeRef.current.depthOfChild(
            submenuID
        );

        // ensure `depth` is non-null and not 0
        if (depth) {
            // multiply depth by 2 because scroll bar hitbox is equal to menu
            // depth + 1
            const zIndex = 10 + depth * 2;
            setZIndex(zIndex);
            logger.debug(
                `openSubmenu: submenu with ID ${submenuID} has depth ` +
                `${depth}; setting z-index to ${zIndex}`
            );
        }
        else {
            setZIndex(10);
            logger.error(
                "openSubmenu: could not get depth of submenu with ID " +
                `${submenuID}`
            );
        }

        const parentMenuMeasuringContainerRect =
            parentMenuMeasuringContainer.getBoundingClientRect();

        const dropdownItemRect =
            dropdownItem.getBoundingClientRect();

        parentMenuScrollTopAtOpenRef.current = parentMenu.scrollTop;

        dropdownItemOffsetInMenuAtOpenRef.current =
            dropdownItemRect.top
            - parentMenuMeasuringContainerRect.top
            + parentMenu.scrollTop;

        // open the submenu
        dropdownMenuMeasuringContainer.classList.add(
            "bd-dropdown-menu-measuring-container-show"
        );

        // we must position the submenu after opening it; otherwise, it will
        // have a rect with all 0s and we won't be able to calculate the
        // position correctly

        if (updateContext) {
            // notify the context that this submenu is open
            contextOpenSubmenu(submenuID);
            positionSubmenu();
        }
        else {
            // if updateContext is false, then it was the context provider that
            // requested this submenu to open, in which case multiple submenus
            // may be opened at once, so we need to schedule the positioning of
            // all submenus in order after all have been opened
            scheduleDropdownMenuReposition();
        }

        setDropdownItemSecondaryFocus(true);

    }, [
        menuItemTreeRef,
        contextOpenSubmenu,
        scheduleDropdownMenuReposition,
        isSubmenu,
        positionSubmenu,
        submenuIsOpen,
        setDropdownItemSecondaryFocus,
        submenuID
    ]);

    const toggleSubmenu = useCallback((): void => {

        if (!isSubmenu) {
            return;
        }

        if (submenuIsOpen) {
            closeSubmenu();
        }
        else {
            openSubmenu();
        }

    }, [
        closeSubmenu,
        isSubmenu,
        openSubmenu,
        submenuIsOpen
    ]);

    const handleDropdownItemClick = useCallback((
        event: MouseEvent
    ): void => {
        logger.debug(
            "handleDropdownItemClick START: for dropdown item with submenu " +
            `ID ${submenuID}; ignoreClicksUntilNextPointerDownRef.current: ` +
            `${ignoreClicksUntilNextPointerDownRef.current}`
        );

        event.preventDefault();

        if (ignoreClicksUntilNextPointerDownRef.current) {
            ignoreClicksUntilNextPointerDownRef.current = false;
            logger.debug(
                "handleDropdownItemClick: " +
                "ignoreClicksUntilNextPointerDownRef.current " +
                "is true; not handling click and stopping propagation"
            );
            event.stopPropagation();
            event.stopImmediatePropagation();
            return;
        }

        if (isSubmenu) {
            // prevent the click from bubbling up to the main dropdown menu
            // click handler and closing all menus; instead, the click should
            // only toggle the visibility of this submenu
            event.stopPropagation();
            event.stopImmediatePropagation();
            logger.debug(
                "handleDropdownItemClick: submenu: stopping propagation for " +
                `dropdown item with submenu ID ${submenuID}`
            );
            // toggle the submenu visibility
            toggleSubmenu();

        } else {
            // the user clicked on a dropdown item without a submenu
            logger.debug(
                "handleDropdownItemClick: leaf item: for dropdown item with " +
                `submenu ID ${submenuID}`
            );

            // if the client has blocked closing the entire dropdown menu,
            // at least close any non-parent open submenus of this menu item

            // get the id of the parent (sub)menu of this menu item
            const parentMenuItemID = menuItemTreeRef.current.parentOf(
                submenuID
            )?.id;

            if (parentMenuItemID) {
                // tell the context to open the parent (sub)menu of this menu
                // item (which must already be open if this item was just
                // clicked), which has the effect of closing any submenus that
                // are not ancestors of this menu item
                contextOpenSubmenu(parentMenuItemID);
            }
            else /* if (!parentMenuItemID) */ {
                logger.debug(
                    "handleDropdownItemClick: no parent menu item ID for " +
                    `dropdown item with submenu ID ${submenuID}; not closing ` +
                    "any submenus"
                );
            }

            if (!closeOnClickLeafItem) {
                // if the client has specified that clicking on a leaf item
                // should not close the entire dropdown menu, then stop
                // propagation to prevent the main dropdown menu's click handler
                // from closing the menu

                event.stopPropagation();
                event.stopImmediatePropagation();
            }
            // else, if closeOnClickLeafItem is true, then we can allow the
            // click to propagate to the main dropdown menu's click handler,
            // which will close the entire menu, including all submenus, so we
            // do not need to do anything here
        }

        onClick?.(event);
    }, [
        isSubmenu,
        toggleSubmenu,
        onClick,
        ignoreClicksUntilNextPointerDownRef,
        submenuID,
        menuItemTreeRef,
        contextOpenSubmenu,
        closeOnClickLeafItem
    ]);

    /**
     * Handles pointer enter events on the dropdown item container DOM element,
     * excluding portaled children. Attached using `addEventListener`. Sets the
     * hovered menu item to this dropdown item container.
     */
    const handleDropdownItemContainerPointerEnterDOM = useEffectEvent((
        event?: PointerEvent
    ): void => {

        if (event?.pointerType === "touch") {
            // do not set hover on touch devices
            return;
        }

        logger.debug(
            "handleDropdownItemContainerPointerEnterDOM: for dropdown item " +
            `with submenu ID ${submenuID}`
        );

        setHoveredMenuItem(submenuID);
    });

    /**
     * Handles pointer leave events on the dropdown item container DOM element,
     * excluding portaled children. Attached using `addEventListener`. Clears
     * the hovered menu item if it is currently this dropdown item container.
     */
    const handleDropdownItemContainerPointerLeaveDOM = useEffectEvent((
        event?: PointerEvent
    ): void => {

        logger.debug(
            "handleDropdownItemContainerPointerLeaveDOM: for dropdown item " +
            `with submenu ID ${submenuID}`
        );

        // if event is undefined, then we were called by
        // `handleScrollbarHitboxPointerChange`, which has already determined
        // the pointer is logically outside the dropdown item container DOM
        if (
            // if the parent has no scrollbar hitbox, then a pointerleave event
            // always means that the pointer has logically left the dropdown
            // item container
            scrollbarHitbox &&
            event?.relatedTarget instanceof HTMLElement &&
            event.relatedTarget.hasAttribute("data-scrollbar-hitbox") &&
            eventWithinDropdownItemContainerRect(event)
        ) {
            // the pointer moved to the scroll bar hitbox, but is still within
            // the bounds of the dropdown item container, so do not clear hover
            logger.debug(
                "handleDropdownItemContainerPointerLeaveDOM: event is within " +
                "dropdown item container rect; not setting hover to false"
            );
            return;
        }
        else {
            // the pointer has logically left the dropdown item container DOM
            unsetHoveredMenuItem();
        }
    });

    /**
     * Handles pointer enter events on the dropdown item container. Attached
     * using React props so that any children in the react component tree—such
     * as portaled children—are also included, rather than only children of the
     * DOM tree. Used to open the submenu, which should happen any time the
     * pointer enters anywhere in the entire dropdown item container, including
     * any portaled submenu children.
     */
    const handleDropdownItemContainerPointerEnter = useCallback((
        event?: React.PointerEvent<HTMLButtonElement> | PointerEvent
    ): void => {

        if (!isSubmenu) {
            return;
        }

        if (event?.pointerType === "touch") {
            // let the click handler open the submenu on touch devices
            return;
        }

        logger.debug(
            "handleDropdownItemContainerPointerEnter: " +
            `for dropdown item with submenu ID ${submenuID}; ` +
            `submenuIsOpen: ${submenuIsOpen}; ` +
            "pointerIsOverDropdownItemContainerComponentTree: " +
            `${pointerIsOverDropdownItemContainerComponentTreeRef.current}`
        );

        if (
            pointerIsOverDropdownItemContainerComponentTreeRef.current
        ) {
            // If the pointer is already considered to be over the dropdown item
            // container component tree, do nothing. DO NOT constantly reset
            // the pointer enter timeout as the pointer moves over the component
            // tree.
            return;
        }

        pointerIsOverDropdownItemContainerComponentTreeRef.current = true;

        if (!mouseHoverEvents) {
            return;
        }

        logger.debug(
            "handleDropdownItemContainerPointerEnter: " +
            `for dropdown item with submenu ID ${submenuID}; ` +
            "scheduling submenu open after delay"
        );

        clearTimeout(pointerEnterTimeoutRef.current);
        clearTimeout(pointerLeaveTimeoutRef.current);
        pointerEnterTimeoutRef.current = setTimeout(() => {
            if (pointerIsOverDropdownItemContainerComponentTreeRef.current) {
                logger.debug(
                    "handleDropdownItemContainerPointerEnter: will open " +
                    `submenu for dropdown item with submenu ID ${submenuID}`
                );
                openSubmenu();
            }
            else {
                logger.debug(
                    "handleDropdownItemContainerPointerEnter: pointer left " +
                    "dropdown item container component tree; not opening " +
                    `submenu for dropdown item with submenu ID ${submenuID}`
                );
            }
        }, POINTER_ENTER_EXIT_DELAY_MS);

    }, [
        mouseHoverEvents,
        isSubmenu,
        submenuIsOpen,
        openSubmenu,
        submenuID
    ]);

    /**
     * Handles pointer leave events on the dropdown item container. Attached
     * using React props so that any children in the react component tree—such
     * as portaled children—are also included, rather than only children of the
     * DOM tree. Used to close the submenu, which should only happen when the
     * pointer leaves the entire dropdown item container, including any portaled
     * submenu children.
     */
    const handleDropdownItemContainerPointerLeave = useCallback((
        event?: React.PointerEvent<HTMLButtonElement> | PointerEvent
    ): void => {

        if (!isSubmenu) {
            return;
        }

        logger.debug(
            "handleDropdownItemContainerPointerLeave: " +
            `for dropdown item with submenu ID ${submenuID}; ` +
            `submenuIsOpen: ${submenuIsOpen}; ` +
            "pointerIsOverDropdownItemContainerComponentTree: " +
            `${pointerIsOverDropdownItemContainerComponentTreeRef.current}`
        );

        if (
            !pointerIsOverDropdownItemContainerComponentTreeRef.current
        ) {
            // If the pointer is already considered to NOT be over the dropdown
            // item container component tree, do nothing. DO NOT constantly
            // reset the pointer leave timeout as the pointer moves over other
            // items.
            return;
        }

        pointerIsOverDropdownItemContainerComponentTreeRef.current = false;

        if (!mouseHoverEvents) {
            return;
        }

        if (
            // if event is undefined, then we were called by
            // `handleScrollbarHitboxPointerChange`, which has already
            // determined the pointer is logically outside the dropdown item
            // container component tree
            event &&
            // if the parent has no scrollbar hitbox, then a pointerleave event
            // always means that the pointer has logically left the dropdown
            // item container
            parentScrollbarHitbox
        ) {

            if (eventWithinDropdownItemContainerComponentTreeRects(event)) {
                // if the pointer moved to the scroll bar hitbox, but is still
                // within the bounds of the dropdown item container, do not
                // close the submenu
                logger.debug(
                    "handleDropdownItemContainerPointerLeave: pointer is " +
                    "within dropdown item container component tree " +
                    "rects; not closing submenu"
                );
                return;
            }
            else {
                logger.debug(
                    "handleDropdownItemContainerPointerLeave: pointer is " +
                    "NOT within dropdown item container component tree " +
                    "rects; will close submenu after delay"
                );
            }
        }

        logger.debug(
            "handleDropdownItemContainerPointerLeave: " +
            `for dropdown item with submenu ID ${submenuID}; ` +
            "scheduling submenu close after delay"
        );

        clearTimeout(pointerEnterTimeoutRef.current);
        clearTimeout(pointerLeaveTimeoutRef.current);
        pointerLeaveTimeoutRef.current = setTimeout(() => {
            if (pointerIsOverDropdownItemContainerComponentTreeRef.current) {
                logger.debug(
                    "handleDropdownItemContainerPointerLeave: pointer " +
                    "re-entered dropdown item container component tree; not " +
                    "closing submenu for dropdown item with submenu ID " +
                    `${submenuID}`
                );
            }
            else {
                logger.debug(
                    "handleDropdownItemContainerPointerLeave: will close " +
                    `submenu for dropdown item with submenu ID ${submenuID}`
                );
                closeSubmenu();
            }
        }, POINTER_ENTER_EXIT_DELAY_MS);

    }, [
        closeSubmenu,
        mouseHoverEvents,
        isSubmenu,
        submenuIsOpen,
        eventWithinDropdownItemContainerComponentTreeRects,
        submenuID,
        parentScrollbarHitbox
    ]);

    /**
     * Handles pointer enter/move/leave events in the scroll bar hitbox. Checks
     * if the pointer is within the bounds of the dropdown item container,
     * including portaled child submenus, and opens/closes the submenu and sets
     * hover state of the dropdown item accordingly.
     */
    const handleScrollbarHitboxPointerChange = useEffectEvent((
        event: PointerEvent
    ): void => {

        // logger.debug(
        //     "handleScrollbarHitboxPointerChange: handling pointer event " +
        //     `${event.type} for dropdown item '${props.text}'`
        // );

        let eventWithinDropdownItemContainerDOM: boolean;

        if (eventWithinDropdownItemContainerRect(event)) {
            // if the pointer is within the bounds of the dropdown item
            // container, call the pointer enter handler
            logger.debug(
                `handleScrollbarHitboxPointerChange: ${event.type} pointer ` +
                "is within bounds of DOM of dropdown item container with" +
                `submenu ID ${submenuID}`
            );
            eventWithinDropdownItemContainerDOM = true;
            handleDropdownItemContainerPointerEnterDOM(event);

        }
        else {
            // pointer is outside the bounds of the dropdown item container
            eventWithinDropdownItemContainerDOM = false;
            handleDropdownItemContainerPointerLeaveDOM();
        }

        if (!isSubmenu) {
            // not a submenu, so no need to open/close anything
            return;
        }

        if (
            eventWithinDropdownItemContainerDOM ||
            eventWithinDropdownItemContainerComponentTreeRects(
                event,
                !eventWithinDropdownItemContainerDOM
            )
        ) {
            // the pointer is within the bounds of the dropdown item container,
            // including portaled child submenus
            logger.debug(
                `handleScrollbarHitboxPointerChange: ${event.type}: pointer ` +
                "is within bounds of component tree of dropdown item " +
                `container with submenu ID ${submenuID}; calling pointer ` +
                "enter handler"
            );
            handleDropdownItemContainerPointerEnter(event);
        }
        else {
            // the pointer is logically outside the dropdown item container,
            // including portaled child submenus
            logger.debug(
                `handleScrollbarHitboxPointerChange: ${event.type}: pointer ` +
                "has left bounds of component tree of dropdown item " +
                `container with submenu ID ${submenuID}; calling pointer ` +
                "leave handler"
            );
            handleDropdownItemContainerPointerLeave();
        }

    });

    // MARK: Effect Events

    const positionSubmenuEffectEvent = useEffectEvent(positionSubmenu);

    const handleDropdownItemClickEffectEvent = useEffectEvent(
        handleDropdownItemClick
    );

    const scheduleDropdownMenuRepositionEffectEvent = useEffectEvent(
        scheduleDropdownMenuReposition
    );

    // MARK: useEffect: parent menu events
    useEffect((/* changes */) => {

        logger.debug(
            `useEffect: parentMenuIsOpen changed to ${parentMenuIsOpen} ` +
            `for dropdown item with submenu ID ${submenuID}`
            // "changes:", changes,
            // "handleDropdownItemClick changes:",
            // // @ts-expect-error
            // handleDropdownItemClick.__debug
        );

        const dropdownItemContainer = dropdownItemContainerRef.current;

        if (parentMenuIsOpen) {

            // update submenu open/closed state based on whether pointer is
            // still logically within the dropdown item container, including
            // portaled child submenus (even if it is physically outside due to
            // scrollbar hitbox)
            parentScrollbarHitbox?.addEventListener(
                "pointerenter", handleScrollbarHitboxPointerChange
            );
            parentScrollbarHitbox?.addEventListener(
                "pointermove", handleScrollbarHitboxPointerChange
            );
            parentScrollbarHitbox?.addEventListener(
                "pointerleave", handleScrollbarHitboxPointerChange
            );

            if (dropdownItemContainer) {
                // use DOM event listener instead of JSX props to only listen to
                // events on the actual dropdown item container, excluding
                // portaled submenus
                dropdownItemContainer.addEventListener(
                    "click", handleDropdownItemClickEffectEvent
                );
                dropdownItemContainer.addEventListener(
                    "pointerdown", handleDropdownItemContainerPointerDown
                );

                // enable hovered state when the pointer enters the dropdown
                // item container, excluding portaled child submenus
                dropdownItemContainer.addEventListener(
                    "pointerenter",
                    handleDropdownItemContainerPointerEnterDOM
                );
                // disable hovered state when the pointer leaves the dropdown
                // item container, excluding portaled child submenus
                dropdownItemContainer.addEventListener(
                    "pointerleave",
                    handleDropdownItemContainerPointerLeaveDOM
                );

            }
            else {
                logger.error(
                    "useEffect: parentMenuIsOpen: dropdownItemContainer is null"
                );
            }

        }
        else /* if (!parentMenuIsOpen) */ {
            // parent menu is closed

            // eslint-disable-next-line react-hooks/set-state-in-effect
            setDropdownItemSecondaryFocus(false);
            unsetHoveredMenuItem();

        }

        return (): void => {

            parentScrollbarHitbox?.removeEventListener(
                "pointerenter", handleScrollbarHitboxPointerChange
            );
            parentScrollbarHitbox?.removeEventListener(
                "pointermove", handleScrollbarHitboxPointerChange
            );
            parentScrollbarHitbox?.removeEventListener(
                "pointerleave", handleScrollbarHitboxPointerChange
            );

            dropdownItemContainer?.removeEventListener(
                "click", handleDropdownItemClickEffectEvent
            );
            dropdownItemContainer?.removeEventListener(
                "pointerdown", handleDropdownItemContainerPointerDown
            );

            dropdownItemContainer?.removeEventListener(
                "pointerenter",
                handleDropdownItemContainerPointerEnterDOM
            );
            dropdownItemContainer?.removeEventListener(
                "pointerleave",
                handleDropdownItemContainerPointerLeaveDOM
            );

        };

    },
        [
            parentMenuIsOpen,
            submenuID,
            parentScrollbarHitbox
        ],
        // [
        //     "parentMenuIsOpen",
        //     "submenuID",
        //     "parentScrollbarHitbox"
        // ]
    );

    // MARK: useEffect: ResizeObserver
    useEffect(() => {

        logger.debug("useEffect: ResizeObserver begin");

        const resizeObserver = new ResizeObserver((/* entries */): void => {

            const dropdownMenuMeasuringContainer =
                dropdownMenuMeasuringContainerRef.current;

            const dropdownMenuContent =
                dropdownMenuContentRef.current;


            if (
                !dropdownMenuMeasuringContainer ||
                !dropdownMenuContent
            ) {
                logger.warn(
                    "useEffect: ResizeObserver: " +
                    "dropdownMenuMeasuringContainer or dropdownMenuContent " +
                    "is null; returning"
                );
                return;
            }

            if (ignoreInitialResizeObserverCallbackRef.current) {
                ignoreInitialResizeObserverCallbackRef.current = false;
                return;
            }


            const measuringContainerOldSize =
                dropdownMenuMeasuringContainerSizeRef.current;
            const measuringContainerNewSize = dropdownMenuMeasuringContainer
                .getBoundingClientRect();

            dropdownMenuMeasuringContainerSizeRef.current =
                measuringContainerNewSize;

            const measuringContainerSizesEqual = domRectsAreEqual(
                measuringContainerOldSize,
                measuringContainerNewSize
            );

            const contentOldSize = dropdownMenuContentSizeRef.current;
            const contentNewSize = dropdownMenuContent.getBoundingClientRect();

            dropdownMenuContentSizeRef.current = contentNewSize;

            const contentSizesEqual = domRectsAreEqual(
                contentOldSize,
                contentNewSize
            );

            const sizesEqual =
                measuringContainerSizesEqual && contentSizesEqual;

            logger.debug(
                "useEffect: ResizeObserver: " +
                "sizesEqual:", sizesEqual,
                "measuringContainerSizesEqual:", measuringContainerSizesEqual,
                "contentSizesEqual:", contentSizesEqual,
                "\nmeasuringContainerOldSize:", measuringContainerOldSize,
                "\nmeasuringContainerNewSize:", measuringContainerNewSize
            );

            if (sizesEqual) {
                logger.debug(
                    "useEffect: ResizeObserver: dropdown menu size did " +
                    "NOT change; not repositioning dropdown menu"
                );
            }
            else {
                logger.debug(
                    "useEffect: ResizeObserver: dropdown menu DID " +
                    "change; repositioning dropdown menu"
                );

                scheduleDropdownMenuRepositionEffectEvent();
            }

        });

        if (submenuIsOpen) {
            if (
                dropdownMenuMeasuringContainerRef.current &&
                dropdownMenuContentRef.current
            ) {
                ignoreInitialResizeObserverCallbackRef.current = true;
                resizeObserver.observe(
                    dropdownMenuMeasuringContainerRef.current
                );
                // we must also observe changes to the dropdown menu content,
                // because changes to its size may not always affect the size of
                // the measuring container: For example, if the content size is
                // already larger than the scroll port of the measuring
                // container and additional content is added, then we need to
                // notify the custom scroll bar to change its geometry
                resizeObserver.observe(
                    dropdownMenuContentRef.current
                );
            }
        }

        return (): void => {
            resizeObserver.disconnect();
        };

    }, [
        submenuIsOpen
    ]);

    // MARK: useEffect: Reposition Submenu Event Listener
    useEffect(() => {

        function handleRepositionSubmenu(
            event: DropdownMenuRepositionSubmenuEvent
        ): void {
            if (event.submenuID === submenuID) {
                if (openMenuIDsPath.includes(submenuID)) {
                    logger.debug(
                        "handleRepositionSubmenu: repositioning submenu for " +
                        `dropdown item with submenu ID ${submenuID}`
                    );
                    positionSubmenuEffectEvent();
                }
                else {
                    logger.debug(
                        "handleRepositionSubmenu: submenu is not open for " +
                        `dropdown item with submenu ID ${submenuID}; not` +
                        "repositioning"
                    );
                }
            }
        }

        // MARK: The root dropdown menu already has listeners for changes
        //  to the visual viewport, so we do not need to add more here.

        repositionSubmenuListenerIDRef.current =
            mainDropdownMenuEventEmitter.addEventListener(
                DropdownMenuEventType.RepositionSubmenu,
                handleRepositionSubmenu
            );

        return (): void => {
            mainDropdownMenuEventEmitter.removeEventListener(
                repositionSubmenuListenerIDRef.current
            );
        };

    }, [
        mainDropdownMenuEventEmitter,
        openMenuIDsPath,
        submenuID
    ]);

    // MARK: useEffect: Sync submenu open state with context provider
    useEffect(() => {

        if (!isSubmenu) {
            // this is not a submenu, so we don't need to do anything
            return;
        }

        // logger.debug(
        //     `useEffect: checking submenu state for '${props.text}' with ID ` +
        //     `${submenuID}; dropdownMenuContext.openSubmenuID: ` +
        //     `${dropdownMenuContext.openSubmenuID}`
        // );

        if (
            !openMenuIDsPath.includes(submenuID) &&
            submenuIsOpen
        ) {
            // close the submenu if it is open and the context provider
            // requested that it be closed


            // if `closeSubmenu` is called as a result of
            // `dropdownMenuContext.openMenuIDsPath` changing to not include
            // this submenu ID, then `closeSubmenu` should not call
            // `dropdownMenuContext.closeSubmenu,` to update context, because
            // this is unnecessary and may cause an infinite loop.

            logger.debug(
                "useEffect: context provider requested close submenu for " +
                `item with submenu ID ${submenuID} because context no longer ` +
                "includes it in openMenuIDsPath"
            );
            // cascading render is unavoidable: each submenu owns its own
            // cleanup logic (timers, styles, refs) that the parent does not
            // know about, so it must synchronously change its state in response
            // to parent state changes

            // eslint-disable-next-line react-hooks/set-state-in-effect
            closeSubmenu({ updateContext: false });
        }
        else if (
            openMenuIDsPath.includes(submenuID) &&
            !submenuIsOpen
        ) {
            // open the submenu if the context provider requested that it be
            // open and it is not already open

            // if `openSubmenu` is called as a result of
            // `dropdownMenuContext.openMenuIDsPath` changing to include this
            // submenu ID, then `openSubmenu` should not call
            // `dropdownMenuContext.openSubmenu,` to update context, because
            // this is unnecessary and may cause an infinite loop.

            logger.debug(
                "useEffect: context provider requested open submenu for item " +
                `with submenu ID ${submenuID} because context includes it in ` +
                "openMenuIDsPath"
            );

            // cascading render is unavoidable: each submenu owns its own
            // cleanup logic (timers, styles, refs) that the parent does not
            // know about, so it must synchronously change its state in response
            // to parent state changes

            // IGNORE-eslint-disable-next-line react-hooks/set-state-in-effect
            openSubmenu({ updateContext: false });
        }

    }, [
        closeSubmenu,
        openMenuIDsPath,
        openSubmenu,
        submenuIsOpen,
        isSubmenu,
        submenuID
    ]);

    // MARK: useEffect: cleanup timers on unmount
    useEffect(() => {

        return (): void => {
            // clear any pending timers
            clearTimeout(pointerEnterTimeoutRef.current);
            clearTimeout(pointerLeaveTimeoutRef.current);
        };

    }, []);

    // MARK: useEffect: cleanup on focus and hover state on unmount
    useEffect(() => {

        return (): void => {

            setDropdownItemSecondaryFocus(false);
            unsetHoveredMenuItem();
        };

    }, []);

    // MARK: DEBUG: open submenu on mount
    // useEffect(() => {
    //     if (
    //         props.text === "submenu 1" &&
    //         !submenuIsOpen &&
    //         !debugDidOpenSubmenuOnMountRef.current
    //     ) {
    //         debugDidOpenSubmenuOnMountRef.current = true;
    //         setTimeout(() => {
    //             openSubmenu();
    //         }, 0);

    //     }
    // }, [openSubmenu, props.text, submenuIsOpen]);

    const dropdownSubmenuContextValue = useMemo(
        (): DropdownSubmenuContextType => ({
            parentMenuIsOpen: submenuIsOpen,
            parentDropdownMenuMeasuringContainerRef:
                dropdownMenuMeasuringContainerRef,
            customScrollbarRef,
            scrollbarHitbox
        }),
        [
            submenuIsOpen,
            scrollbarHitbox
        ]
    );

    const dropdownItemSlotsContextValue = useMemo(
        (): DropdownItemSlotsContextType => ({
            setLabel,
            setSubmenu,
            setSubmenuID
        }),
        []
    );

    const disclosureIndicatorContextValue = useMemo(
        (): DisclosureIndicatorContextType => ({
            submenuIsOpen
        }),
        [
            submenuIsOpen
        ]
    );

    return (
        <DropdownItemSlotsContext.Provider
            value={dropdownItemSlotsContextValue}
        >
            {children}
            <button
                className="bd-dropdown-item-container"
                data-submenu-id={submenuID}
                data-has-submenu={isSubmenu}
                ref={dropdownItemContainerRef}
                onPointerEnter={handleDropdownItemContainerPointerEnter}
                onPointerLeave={handleDropdownItemContainerPointerLeave}
                aria-haspopup={isSubmenu ? "menu" : undefined}
                aria-expanded={isSubmenu ? submenuIsOpen : undefined}
                aria-controls={isSubmenu ? submenuID : undefined}
                aria-owns={isSubmenu ? submenuID : undefined}
            >
                <div
                    className="bd-dropdown-item"
                    ref={dropdownItemRef}
                    data-has-submenu={isSubmenu}
                    data-submenu-id={submenuID}
                    data-hover={hoveredMenuItem === submenuID}
                    data-secondary-focus={dropdownItemSecondaryFocus}
                >
                    <DisclosureIndicatorContext.Provider
                        value={disclosureIndicatorContextValue}
                    >

                        <div
                            className="bd-dropdown-item-label"
                            // provided so that the client can customize styles
                            // based on these states
                            data-has-submenu={isSubmenu}
                            data-submenu-id={submenuID}
                            data-hover={hoveredMenuItem === submenuID}
                            data-secondary-focus={dropdownItemSecondaryFocus}
                        >
                            {label}
                        </div>
                        {
                            debugConfig.showMenuIds &&
                            (
                                <div className="bd-dropdown-debug-id">
                                    {submenuID}
                                </div>
                            )
                        }
                    </DisclosureIndicatorContext.Provider>
                </div>
                {/* WebKit (Safari) clips the submenu to the parent element when
                    the parent is scrollable. Also, even on non-WebKit browsers,
                    the submenu does not move up and down with the page when it
                    is rubber band scrolling if it is inside the
                    dropdownItemContainer. */}
                {isSubmenu && createPortal((
                    // the measuring container is necessary so that the width of
                    // the scroll bar can be measured
                    <div
                        className="bd-dropdown-menu-measuring-container"
                        ref={dropdownMenuMeasuringContainerRef}
                        role="menu"
                        id={submenuID}
                        data-submenu-id={submenuID}
                        style={{
                            zIndex
                        }}
                    >
                        <div
                            className="bd-dropdown-menu bd-dropdown-submenu"
                            ref={dropdownMenuRef}
                            onClick={handleDropdownMenuClick}
                            data-submenu-id={submenuID}
                        >
                            <DropdownMenuCore
                                isOpen={submenuIsOpen}
                                handle={dropdownMenuCoreRef}
                                dropdownMenuRef={dropdownMenuRef}
                                dropdownMenuContentRef={dropdownMenuContentRef}
                            >
                                <DropdownSubmenuContext.Provider
                                    value={dropdownSubmenuContextValue}
                                >
                                    {submenu}
                                </DropdownSubmenuContext.Provider>
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
                    ?? document.body
                )}
            </button>
        </DropdownItemSlotsContext.Provider>
    );
});

// use any to exclude from the generated .d.ts file
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
(_DropdownItem as any).displayName = "DropdownItem";

/**
 * A dropdown item component that can optionally contain a submenu.
 *
 * @param props - An object containing:
 * - `onClick` - A click handler for the dropdown item.
 *
 * @public
 */
export const DropdownItem = _DropdownItem as
    (props: DropdownItemProps) => ReactNode;
