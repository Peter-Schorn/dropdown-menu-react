import {
    type JSX,
    type PropsWithChildren,
    type ReactNode,
    type SetStateAction,
    type Ref as ReactRef,
    type SyntheticEvent as ReactSyntheticEvent,
    type MouseEvent as ReactMouseEvent,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    memo,
    useImperativeHandle,
    useLayoutEffect,
} from "react";

import { createPortal, flushSync } from "react-dom";

import {
    CustomScrollbar,
    type CustomScrollbarHandle
} from "./CustomScrollbar";

import {
    type DropdownMenuCoreHandle,
    DropdownMenuCore
} from "./DropdownMenuCore";

import {
    type DropdownMenuContextType,
    DropdownMenuContext
} from "../model/context/DropdownMenuContext";

import {
    type DropdownSubmenuContextType,
    DropdownSubmenuContext
} from "../model/context/DropdownSubmenuContext";

import { MenuItemNode } from "../model/MenuItemNode";

import {
    DropdownMenuEventEmitter,
    DropdownMenuEventType,
} from "../model/DropdownMenuEventEmitter";

import {
    DROPDOWN_IDEAL_MIN_WIDTH
} from "../utils/constants";

import { useArrayStateRef } from "../hooks/useStateRef";

import { useEffectEvent } from "../hooks/useEffectEvent";

import { useDebugConfig } from "../hooks/useDebugConfig";

// import { defaultDebugConfig } from "../utils/debugConfig";

// import {
//     useEffectDebug
// } from "../hooks/useEffectDebug";

// import {
//     useCallbackDebug
// } from "../hooks/useCallbackDebug";

import type { HorizontalEdge, } from "../types/misc";

import {
    isWebkit,
    clamp,
    domRectsAreEqual
} from "../utils/MiscellaneousUtilities";

import { dropdownMenuLogger as logger } from "../utils/loggers";

/**
 * An event that could trigger a request for the dropdown menu to change its
 * open state. This could be a native DOM event or a React synthetic event.
 *
 * @public
 */
export type OnRequestOpenChangeEvent =
    | Event
    | ReactSyntheticEvent;

/**
 * An imperative handle for the {@link DropdownMenu} component that allows
 * parent components to imperatively control the open state of the dropdown menu
 * and access information about the open submenus.
 *
 * @public
 */
export type DropdownMenuHandle = {
    /**
     * Opens the submenu with the given ID. If the submenu is already open, does
     * nothing.
     */
    openSubmenu: (submenuID: string) => void;

    /**
     * Closes the submenu with the given ID. If the submenu is already closed,
     * does nothing.
     */
    closeSubmenu: (submenuID: string) => void;

    /**
     * Returns the path of open menu IDs from the root menu to the deepest open
     * submenu, or an empty array if the dropdown menu is not open.
     *
     * Mutating the returned array will not affect the internal state of the
     * dropdown menu.
     */
    getOpenMenuIDsPath: () => string[];

    /**
     * Clears any pending open submenu request that has not yet been executed.
     *
     * When the dropdown menu is externally controlled and a client requests to
     * open a submenu when the dropdown menu is not currently open, the dropdown
     * menu must first request to change the open state via
     * `onRequestOpenChange`. Only after the client sets `isOpen` to true will
     * the dropdown menu open and execute the pending open submenu request. If
     * the client does not set `isOpen` to true, then the pending open submenu
     * request will never be executed and will remain pending until the next
     * time dropdown menu opens. Calling this method allows the client to clear
     * the pending open submenu request.
     */
    clearPendingOpenSubmenuRequest: () => void;
};

/**
 * The base props for the {@link DropdownMenu} component, which are shared
 * between both the internally controlled and externally controlled versions of
 * the component.
 *
 * @public
 */
export type DropdownMenuPropsBase = PropsWithChildren<{
    /**
     * Optional ref to access DropdownMenuHandle methods.
     */
    handle?: ReactRef<DropdownMenuHandle>;

    /**
     * Whether the entire dropdown menu should close when clicking outside of
     * the menu. default: `true`.
     */
    closeOnClickOutside?: boolean;

    /**
     * Whether the entire dropdown menu should close when clicking on a menu
     * item that does not contain a sub menu. default: `true`. This can be
     * overridden on a per-menu-item basis by calling `event.stopPropagation()`
     * in the `DropdownItem`'s `onClick` handler, which will prevent the click
     * event from bubbling up to this `DropdownMenu` click handler.
     */
    closeOnClickLeafItem?: boolean;

    /**
     * Whether to enable opening and closing of submenus via mouse hover events,
     * and scrolling menus when hovering over the scroll arrows. Defaults to
     * `true`. Even if set to `false`, hover events will still change the
     * hovered state of menu items, which can affect styling.
     */
    mouseHoverEvents?: boolean;

    /**
     * Whether to enable navigating the menu and opening/closing submenus via
     * keyboard events. Defaults to `true`. Even if set to `false`, does *not*
     * disable any browser-default keyboard interactions, such as using tab to
     * focus dropdown items.
     */
    enableKeyEvents?: boolean;

    /**
     * Callback that is called whenever the open menu path changes, with the
     * path of open menu IDs from the root menu to the deepest open submenu.
     * This can be used to track which submenus are open.
     *
     * Will also be called when the dropdown menu mounts.
     */
    onOpenMenusChange?: (openMenuIDsPath: string[]) => void;
}>;

/**
 * Props for the `DropdownMenu` component when the open state is controlled
 * internally by the component. In this case, the `isOpen` and
 * `onRequestOpenChange` props should not be provided.
 *
 * @public
 */
export type DropdownMenuPropsInternallyControlled = DropdownMenuPropsBase & {
    /**
     * The open state of the dropdown menu is managed internally by the
     * component.
     */
    isOpen?: never;

    /**
     * The `onRequestOpenChange` prop should not be provided when the dropdown
     * menu is internally controlled, because there is no external open state to
     * request changes to.
     */
    onRequestOpenChange?: never;
};

/**
 * Props for the `DropdownMenu` component when the open state is controlled
 * externally via the `isOpen` prop. In this case, the `isOpen` and
 * `onRequestOpenChange` props must both be provided.
 *
 * @public
 */
export type DropdownMenuPropsExternallyControlled = DropdownMenuPropsBase & {

    /**
     * Whether the dropdown menu is open.
     */
    isOpen: boolean;

    /**
     * Callback that is called whenever the dropdown menu requests to change its
     * open state.
     *
     * @param open - The requested new open state of the dropdown menu.
     * @param event - The event that triggered the open state change request, if
     * applicable.
     */
    onRequestOpenChange: (
        open: boolean,
        event?: OnRequestOpenChangeEvent
    ) => void;
};

/**
 * Props for the `DropdownMenu` component.
 *
 * This component can be used in either an internally controlled or externally
 * controlled mode. In the internally controlled mode, the open state of the
 * dropdown menu is managed internally by the component, and the `isOpen` and
 * `onOpenChange` props should not be provided. In the externally controlled
 * mode, the open state of the dropdown menu is managed by the parent component,
 * and BOTH the `isOpen` and `onOpenChange` props must be provided.
 *
 * @public
 */
export type DropdownMenuProps =
    | DropdownMenuPropsInternallyControlled
    | DropdownMenuPropsExternallyControlled;

// doc comments are on the exported `DropdownMenu` component at the bottom so
// that they are visible in the docs
const _DropdownMenu = memo(function DropdownMenu(
    props: DropdownMenuProps
): JSX.Element {

    logger.debug("DropdownMenu: render");

    const debugConfig = useDebugConfig();
    // const debugConfig = defaultDebugConfig;

    const {
        handle,
        isOpen: externalIsOpen,
        onRequestOpenChange,
        children,
        closeOnClickLeafItem = true,
        closeOnClickOutside = true,
        mouseHoverEvents = true,
        enableKeyEvents = true,
        onOpenMenusChange
    } = props;

    // The internal open state of the dropdown menu. Used when the open state is
    // not controlled externally via the `isOpen` prop.
    const [internalIsOpen, setInternalIsOpen] = useState(false);

    /**
     * Whether the open state is controlled externally via the `isOpen` prop
     * provided by the user of this component.
     */
    const isExternallyControlled = externalIsOpen !== undefined;

    /**
     * The current open state of the dropdown menu. This is either controlled
     * externally via the `externalIsOpen` prop, or internally via state
     * (internalIsOpen).
     */
    const isOpen = isExternallyControlled
        ? externalIsOpen
        : internalIsOpen;

    /**
     * Sets the open state of the dropdown menu. If the open state is controlled
     * externally, this will call the `onOpenChange` callback instead. If the
     * open state is controlled internally, this will update the
     * `internalIsOpen` state.
     */
    const setIsOpen = useCallback((
        open:
            | boolean
            | ((prevIsOpen: boolean, event?: OnRequestOpenChangeEvent) => boolean),
        event?: OnRequestOpenChangeEvent
    ): void => {

        if (isExternallyControlled) {
            // When `open` is a function, we call it with the `setIsOpen`
            // closure's `isOpen` value, which could theoretically be stale if
            // multiple updates occur before re-render. However, this is
            // acceptable because in controlled mode, the parent owns the state
            // and should handle updates properly.
            const resolvedOpen = typeof open === "function"
                ? open(isOpen, event)
                : open;

            onRequestOpenChange(resolvedOpen, event);
        } else {
            // when internally controlled, we pass `open` directly to
            // setInternalIsOpen, which guarantees access to the latest state
            // via React's state updater mechanism
            setInternalIsOpen(open);
        }
    }, [
        isExternallyControlled,
        onRequestOpenChange,
        isOpen
    ]);

    /**
     * Whether the dropdown menu has finished opening. This becomes true after
     * the menu has been opened and positioned. It becomes false when the menu
     * is closed.
     */
    const didFinishOpenRef = useRef(false);

    const [
        submenusPortalContainer,
        setSubmenusPortalContainer
    ] = useState<HTMLDivElement | null>(null);

    const [
        openMenuIDsPath,
        setOpenMenuIDsPath,
        openMenuIDsPathRef
    ] = useArrayStateRef<string>([]);

    const [
        scrollbarHitbox,
        setScrollbarHitbox
    ] = useState<HTMLDivElement | null>(null);

    const mainDropdownMenuEventEmitter = useMemo(
        () => new DropdownMenuEventEmitter(),
        []
    );

    const hoveredMenuItemRef = useRef<string | null>(null);

    const menuID = useMemo(
        () => crypto.randomUUID(),
        []
    );

    const dropdownRef = useRef<HTMLDivElement>(null);
    const dropdownToggleRef = useRef<HTMLButtonElement>(null);
    const dropdownMenuMeasuringContainerRef = useRef<HTMLDivElement>(null);
    const dropdownMenuRef = useRef<HTMLDivElement>(null);
    const dropdownMenuContentRef = useRef<HTMLDivElement>(null);
    const dropdownMenuCoreRef = useRef<DropdownMenuCoreHandle | null>(null);
    const customScrollbarRef = useRef<CustomScrollbarHandle | null>(null);

    const ignoreClicksUntilNextPointerDownRef = useRef<boolean>(false);

    const menuItemTreeRef = useRef(new MenuItemNode({ id: menuID }));

    const menuItemsAlignmentRef = useRef<Map<string, HorizontalEdge>>(
        new Map<string, HorizontalEdge>([
            [menuID, "right"]
        ])
    );

    const repositionMenusRafIdRef = useRef<number | null>(null);
    const buildMenuItemTreeRafIdRef = useRef<number | null>(null);

    /**
     * The size of the dropdown menu measuring container.
     */
    const dropdownMenuMeasuringContainerSizeRef = useRef<DOMRect | null>(null);

    /**
     * The size of the dropdown menu content.
     */
    const dropdownMenuContentSizeRef = useRef<DOMRect | null>(null);

    /**
     * Used to ignore the initial callback from the ResizeObserver, which occurs
     * when the observer is first created. The useEffect that creates the
     * ResizeObserver will rerun when certain dependencies change, which will
     * recreate the ResizeObserver and trigger the initial callback even if the
     * size has not changed.
     */
    const ignoreInitialResizeObserverCallbackRef = useRef<boolean>(false);

    /**
     * If the client requests to open a submenu when the dropdown menu is not
     * currently open, then we must ask the dropdown menu to open first, and
     * then, if the open request is not blocked, open the requested submenu
     * after the menu has finished opening.
     */
    const pendingOpenSubmenuIDRef = useRef<string | null>(null);

    const setHoveredMenuItem = useCallback((
        setter: SetStateAction<string | null>
    ): void => {

        const nextHoveredMenuItem = typeof setter === "function"
            ? setter(hoveredMenuItemRef.current)
            : setter;

        if (nextHoveredMenuItem === hoveredMenuItemRef.current) {
            // no change in hovered menu item, so bail out
            return;
        }

        hoveredMenuItemRef.current = nextHoveredMenuItem;

        logger.debug(
            "setHoveredMenuItem: set hovered menu item to " +
            `${nextHoveredMenuItem}`
        );

        mainDropdownMenuEventEmitter.emitEvent(
            DropdownMenuEventType.HoveredMenuItemChange, {
            hoveredMenuItem: nextHoveredMenuItem
        });

    }, [
        mainDropdownMenuEventEmitter
    ]);

    const getSubmenuItemTree = useCallback((
        submenuID: string
    ): MenuItemNode => {

        const node = new MenuItemNode({
            id: submenuID
        });

        if (!submenusPortalContainer) {
            logger.warn(
                "getSubmenuItemTree: submenusPortalContainer is null"
            );
            return node;
        }

        const submenu = submenusPortalContainer.querySelector<HTMLElement>(
            `.bd-dropdown-submenu[data-submenu-id="${submenuID}"]`
        );
        if (!submenu) {
            return node;
        }

        const submenuItems = submenu.querySelectorAll<HTMLElement>(
            ".bd-dropdown-item-container"
        );

        for (const menuItem of submenuItems) {
            const submenuID = menuItem.dataset.submenuId;
            if (!submenuID) {
                // no submenu;
                continue;
            }
            // recursion
            // eslint-disable-next-line react-hooks/immutability
            const submenuTree = getSubmenuItemTree(submenuID);
            node.addChild(submenuTree);
        }

        return node;

    }, [submenusPortalContainer]);

    const buildMenuItemTree = useCallback((): void => {

        logger.debug("buildMenuItemTree: begin");

        const dropdownMenu = dropdownMenuRef.current;
        if (!dropdownMenu) {
            logger.debug(
                "buildMenuItemTree: dropdownMenu is null"
            );
            return;
        }

        const menuItemTree = new MenuItemNode({
            id: menuID
        });

        const topLevelMenuItems = dropdownMenu.querySelectorAll<HTMLElement>(
            ".bd-dropdown-item-container"
        );

        for (const menuItem of topLevelMenuItems) {
            const submenuID = menuItem.dataset.submenuId;
            if (!submenuID) {
                continue;
            }

            const submenuNode = getSubmenuItemTree(submenuID);

            menuItemTree.addChild(submenuNode);

        }

        menuItemTreeRef.current = menuItemTree;
        logger.debug(
            "buildMenuItemTree: built menu item tree:\n" +
            `${menuItemTree.toTreeString()}`
        );

    }, [
        getSubmenuItemTree,
        menuID
    ]);

    const scheduleBuildMenuItemTreeEffectEvent = useEffectEvent((): void => {

        logger.debug(
            "scheduleBuildMenuItemTree: scheduling build of menu item tree"
        );

        if (buildMenuItemTreeRafIdRef.current !== null) {
            return;
        }

        buildMenuItemTreeRafIdRef.current = requestAnimationFrame(() => {
            buildMenuItemTreeRafIdRef.current = null;
            buildMenuItemTree();
        });

    });

    const clearPendingOpenSubmenuRequest = useCallback((): void => {
        pendingOpenSubmenuIDRef.current = null;
    }, []);

    /**
     * Notifies the submenus that they should reposition themselves. This should
     * only occur after the main dropdown menu has finished positioning itself,
     * because the position of the submenus is relative to the position of the
     * main dropdown menu. Furthermore, the position of each submenu is relative
     * to the position of its parent menu item, so the request for each submenu
     * to reposition itself should occur in the order of the depth of the
     * submenus in the menu item tree.
     */
    const requestRepositionSubmenus = useCallback((): void => {

        if (openMenuIDsPathRef.current.length <= 1) {
            logger.debug(
                "requestRepositionSubmenus: no open submenus; nothing to do"
            );
            return;
        }

        logger.debug(
            "requestRepositionSubmenus: queuing reposition of submenus"
        );

        const submenuIDs = openMenuIDsPathRef.current.slice(1);

        for (const [_, submenuID] of submenuIDs.entries()) {
            logger.debug(
                "requestRepositionSubmenus: requesting reposition of " +
                `submenu with ID ${submenuID}`
            );
            mainDropdownMenuEventEmitter.emitEvent(
                DropdownMenuEventType.RepositionSubmenu,
                {
                    submenuID
                }
            );
        }

    }, [
        mainDropdownMenuEventEmitter,
        openMenuIDsPathRef
    ]);

    const positionDropdownMenu = useCallback((
    ): void => {

        const performanceMarkDetail = {
            menuID: menuID,
            openMenuIDsPath: openMenuIDsPathRef.current
        };

        performance.mark("position-dropdown-menu-start", {
            detail: performanceMarkDetail
        });

        const dropdownToggle = dropdownToggleRef.current;
        const dropdownMenuMeasuringContainer = dropdownMenuMeasuringContainerRef.current;
        const dropdownMenu = dropdownMenuRef.current;
        const dropdownMenuContent = dropdownMenuContentRef.current;

        if (
            !dropdownToggle ||
            !dropdownMenuMeasuringContainer ||
            !dropdownMenu ||
            !dropdownMenuContent
        ) {
            logger.warn(
                "positionDropdownMenu: dropdownToggle or " +
                "dropdownMenuMeasuringContainer or dropdownMenu or " +
                "dropdownMenuContent is null"
            );
            return;
        }

        logger.debug(
            "------ positionDropdownMenu: begin ------ " +
            `menuID: ${menuID}`
        );

        // const { scrollX, scrollY } = window;

        const vOffsetTop = visualViewport?.offsetTop ?? 0;
        const vOffsetLeft = visualViewport?.offsetLeft ?? 0;
        const visibleWidth = visualViewport?.width ?? window.innerWidth;
        const visibleHeight = visualViewport?.height ?? window.innerHeight;

        const verticalPadding = visibleHeight * 0.01;
        const horizontalPadding = visibleWidth * 0.01;

        const dropdownToggleRect = dropdownToggle.getBoundingClientRect();

        /** The dropdown menu measuring container rect. */
        let dropdownMenuRect = dropdownMenuMeasuringContainer.getBoundingClientRect();

        /** The actual dropdown menu rect (not measuring container) */
        const dropdownMenuActualRect = dropdownMenu.getBoundingClientRect();

        /** The dropdown menu content rect */
        const dropdownMenuContentRect = dropdownMenuContent.getBoundingClientRect();

        /**
         * The vertical padding inside the dropdown menu container: Reflects the
         * difference between the height of the dropdown menu measuring
         * container and the height of the dropdown menu content.
         */
        const dropdownMenuContainerVerticalPadding = Math.round(
            (dropdownMenuActualRect.top - dropdownMenuRect.top) * 2
        );

        // logger.debug(
        //     "positionDropdownMenu:" +
        //     `\nscrollX: ${scrollX}` +
        //     `\nscrollY: ${scrollY}` +
        //     `\nvOffsetTop: ${vOffsetTop}`,
        //     `\nvOffsetLeft: ${vOffsetLeft}`,
        //     `\nvisibleWidth: ${visibleWidth}`,
        //     `\nvisibleHeight: ${visibleHeight}`,
        //     `\ndropdownMenuContainerVerticalPadding: ${dropdownMenuContainerVerticalPadding}`,
        //     "\ndropdownToggleRect:", dropdownToggleRect,
        //     "\ndropdownMenuRect:", dropdownMenuRect,
        //     "\ndropdownMenuActualRect:", dropdownMenuActualRect,
        //     "\ndropdownMenuContentRect:", dropdownMenuContentRect
        // );

        // MARK: - Vertical Positioning -
        // #region vertical-positioning

        // MARK: check if menu would overflow bottom of *VISUAL* viewport
        let overflowsVisualViewportBottom: boolean;

        let visibleTopEdge: number;
        let visibleBottomEdge: number;

        if (isWebkit) {
            // is Safari

            visibleTopEdge = 0;
            visibleBottomEdge = visibleHeight;
        }
        else {
            // is Chrome

            visibleTopEdge = vOffsetTop;
            visibleBottomEdge = visibleHeight + vOffsetTop;
        }

        /**
         * The distance between the top of the dropdown toggle and the
         * top of the visual viewport.
         */
        const aboveDropdownToggleLength = dropdownToggleRect.top
            - visibleTopEdge;

        /**
         * The distance between the bottom of the dropdown toggle and the
         * bottom of the visual viewport.
         */
        const belowDropdownToggleLength = visibleBottomEdge
            - dropdownToggleRect.bottom;

        /**
         * The height of the dropdown menu container if there were no scroll
         * bars. Represents the total height that would be needed to display the
         * entire dropdown menu.
         */
        const idealDropdownMenuContainerHeight =
            dropdownMenuContentRect.height
            + dropdownMenuContainerVerticalPadding;

        /**
         * The bottom of the dropdown menu if the height was not constrained to
         * be above the bottom of the visual viewport and there were no scroll
         * bars.
         */
        const idealDropdownMenuContainerScrollBottom =
            dropdownToggleRect.bottom + idealDropdownMenuContainerHeight;

        if (
            idealDropdownMenuContainerScrollBottom + verticalPadding
            > visibleBottomEdge
        ) {
            overflowsVisualViewportBottom = true;
        }
        else {
            overflowsVisualViewportBottom = false;
        }

        const moreSpaceAboveDropdownToggle =
            aboveDropdownToggleLength > belowDropdownToggleLength;

        logger.debug(
            "positionDropdownMenu:" +
            `\ndropdownToggleRect.top: ${dropdownToggleRect.top}` +
            `\ndropdownToggleRect.bottom: ${dropdownToggleRect.bottom}` +
            `\ndropdownMenuRect.bottom: ${dropdownMenuRect.bottom}` +
            `\nbelowDropdownToggleLength: ${belowDropdownToggleLength}` +
            `\naboveDropdownToggleLength: ${aboveDropdownToggleLength}` +
            `\noverflowsVisualViewportBottom: ${overflowsVisualViewportBottom}` +
            `\nmoreSpaceAboveDropdownToggle: ${moreSpaceAboveDropdownToggle}`
        );

        // logger.debug(
        //     "positionDropdownMenu: " +
        //     `overflowsVisualViewportBottom: ${overflowsVisualViewportBottom}`
        // );

        // logger.debug(
        //     "positionDropdownMenu: " +
        //     `aboveDropdownToggleLength: ${aboveDropdownToggleLength}; ` +
        //     `belowDropdownToggleLength: ${belowDropdownToggleLength}`
        // );

        if (overflowsVisualViewportBottom && moreSpaceAboveDropdownToggle) {
            // MARK: Align above the dropdown toggle

            // Ensure menu does not overflow the *VISUAL* viewport

            logger.debug(
                "positionDropdownMenu: aligning bottom edge of menu to " +
                "top edge of dropdown toggle"
            );

            /**
             * The ideal top offset to align the bottom of the dropdown menu to
             * the top of the dropdown toggle.
             */
            const idealTopOffset = -idealDropdownMenuContainerHeight;

            /**
             * The minimum top offset that would prevent the top of the dropdown
             * menu from overflowing the top of the visual viewport
             */
            const minTopOffset = visibleTopEdge - dropdownToggleRect.top
                + verticalPadding;

            /**
             * The maximum top offset that would prevent the bottom of the
             * dropdown menu from overflowing the bottom of the visual viewport
             * if the menu had no scrollbars.
             */
            const maxTopOffset = Math.max(
                minTopOffset,
                visibleBottomEdge - dropdownToggleRect.top
                - idealDropdownMenuContainerHeight - verticalPadding
            );


            const topOffset = clamp(idealTopOffset, {
                min: minTopOffset,
                max: maxTopOffset
            });

            dropdownMenuMeasuringContainer.style.top = `${topOffset}px`;

            // MARK: Update Max Height

            /**
             * The necessary height to fit the dropdown menu without scrollbars.
             */
            const idealMaxHeight = idealDropdownMenuContainerHeight;

            /**
             * The bottom edge to use for max height calculations: The lower of
             * the bottom of the visual viewport and the top of the dropdown
             * toggle.
             */
            const bottomEdge = Math.min(
                visibleBottomEdge - verticalPadding,
                dropdownToggleRect.top
            );

            /** The just set top of the dropdown menu. */
            const dropdownMenuTop = topOffset + dropdownToggleRect.top;

            /**
             * The total height available between the just set top of the
             * dropdown menu container and the bottom edge defined above.
             */
            const availableHeight = bottomEdge - dropdownMenuTop;

            const maxHeight = Math.min(idealMaxHeight, availableHeight);

            dropdownMenuMeasuringContainer.style.maxHeight = `${maxHeight}px`;

            logger.debug(
                `positionDropdownMenu: topOffset: ${topOffset}; ` +
                `idealTopOffset: ${idealTopOffset}; ` +
                `minTopOffset: ${minTopOffset}; ` +
                `maxTopOffset: ${maxTopOffset}; ` +
                `idealMaxHeight: ${idealMaxHeight}; ` +
                `availableHeight: ${availableHeight}; ` +
                `maxHeight: ${maxHeight}`
            );

        }
        else {
            // MARK: Align below the dropdown toggle

            // Ensure menu does not overflow the *VISUAL* viewport

            /**
             * The ideal top offset to align the top of the dropdown menu to the
             * bottom of the dropdown toggle.
             */
            const idealTopOffset = dropdownToggleRect.height;

            const minTopOffset = visibleTopEdge - dropdownToggleRect.top
                + verticalPadding;

            const topOffset = Math.max(idealTopOffset, minTopOffset);

            dropdownMenuMeasuringContainer.style.top = `${topOffset}px`;

            // MARK: Update Max Height

            /**
             * The necessary height to fit the dropdown menu without scrollbars.
             */
            const idealMaxHeight = idealDropdownMenuContainerHeight;

            /**
             * The just set top of the dropdown menu.
             */
            const dropdownMenuTop = topOffset + dropdownToggleRect.top;

            /**
             * The bottom edge to use for max height calculations: The bottom of
             * the visual viewport minus vertical padding.
             */
            const bottomEdge = visibleBottomEdge - verticalPadding;

            /**
             * The total height available between the just set top of the
             * dropdown menu container and the bottom edge defined above.
             */
            const availableHeight = bottomEdge - dropdownMenuTop;

            const maxHeight = Math.min(idealMaxHeight, availableHeight);

            dropdownMenuMeasuringContainer.style.maxHeight = `${maxHeight}px`;

            logger.debug(
                `positionDropdownMenu: topOffset: ${topOffset}; ` +
                `idealTopOffset: ${idealTopOffset}; ` +
                `minTopOffset: ${minTopOffset}; ` +
                `idealMaxHeight: ${idealMaxHeight}; ` +
                `availableHeight: ${availableHeight}; ` +
                `maxHeight: ${maxHeight}`
            );

        }
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
            // this caller is already batched to animation frames and we need an
            // update immediately anyway because the horizontal positioning
            // logic below relies on up-to-date geometry
            batchToAnimationFrame: false,
            // we will call `repositionScrollbarHitbox` after updating the
            // horizontal position
            repositionScrollbarHitbox: false
        });

        // after vertical positioning, the width may have changed due to
        // scrollbar appearance/disappearance
        dropdownMenuRect = dropdownMenuMeasuringContainer.getBoundingClientRect();

        // MARK: - Horizontal Positioning -
        // #region horizontal-positioning

        let visualLeftEdge: number;

        if (isWebkit) {
            // is Safari
            visualLeftEdge = 0;
        }
        else {
            // is Chrome
            visualLeftEdge = vOffsetLeft;
        }


        // position the left edge of the menu to the left edge of the dropdown
        // toggle
        const idealLeftOffset = 0;

        const minLeftOffset = -dropdownToggleRect.left + horizontalPadding
            + visualLeftEdge;

        const maxLeftOffset = visibleWidth - dropdownMenuRect.width
            - dropdownToggleRect.left - horizontalPadding + visualLeftEdge;

        const leftOffset = clamp(idealLeftOffset, {
            min: minLeftOffset,
            max: maxLeftOffset
        });

        dropdownMenuMeasuringContainer.style.left = `${leftOffset}px`;

        logger.debug(
            `positionDropdownMenu: leftOffset: ${leftOffset}; ` +
            `idealLeftOffset: ${idealLeftOffset}; ` +
            `minLeftOffset: ${minLeftOffset}; ` +
            `maxLeftOffset: ${maxLeftOffset}`
        );

        // #endregion horizontal-positioning

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
            "------ positionDropdownMenu: end ------ "
        );

        performance.mark("position-dropdown-menu-end", {
            detail: performanceMarkDetail
        });

        performance.measure(
            "position-dropdown-menu",
            "position-dropdown-menu-start",
            "position-dropdown-menu-end"
        );

        requestRepositionSubmenus();

    },
        [
            openMenuIDsPathRef,
            requestRepositionSubmenus,
            menuID
        ]
        // [
        //     "openMenuIDsPathRef",
        //     "requestRepositionSubmenus",
        //     "menuID"
        // ]
    );

    const scheduleDropdownMenuReposition = useCallback((): void => {

        logger.debug(
            "scheduleDropdownMenuReposition: scheduling reposition"
        );

        //  if a reposition is already scheduled for the next animation frame,
        //  do nothing
        if (repositionMenusRafIdRef.current !== null) {
            return;
        }

        // schedule reposition for next frame
        repositionMenusRafIdRef.current = requestAnimationFrame(() => {
            repositionMenusRafIdRef.current = null;
            logger.debug(
                "scheduleDropdownMenuReposition: executing scheduled reposition"
            );
            positionDropdownMenu();
        });
    }, [positionDropdownMenu]);

    const toggleDropdownMenu = useCallback((
        event?: OnRequestOpenChangeEvent
    ): void => {
        setIsOpen(
            isOpen => !isOpen,
            event
        );
    }, [
        setIsOpen
    ]);

    const openSubmenu = useCallback((
        submenuID: string
    ): void => {


        if (!isOpen) {

            if (!menuItemTreeRef.current.hasChild(submenuID)) {
                logger.error(
                    `openSubmenu: submenu with ID ${submenuID} not found ` +
                    "in menu item tree:\n" +
                    `${menuItemTreeRef.current.toTreeString()}`
                );
                return;
            }

            logger.debug(
                "openSubmenu: dropdown menu is not open; setting pending " +
                `open submenu ID to ${submenuID} and opening dropdown menu`
            );

            // if the client requests to open a submenu when the dropdown menu
            // is not currently open, then we must ask the dropdown menu to open
            // first, and then, if the open request is not blocked, open the
            // requested submenu after the menu has finished opening.
            pendingOpenSubmenuIDRef.current = submenuID;
            setIsOpen(true);

            return;
        }

        // If one submenu (a) is already open and we are opening a different
        // submenu (b) that is not a child of any currently open submenu, we
        // need to close (a) and open (b) synchronously to avoid flicker where
        // (a) stays open for a frame after (b) opens. This would happen without
        // `flushSync` because opening b in response to a user action (e.g.
        // click, keyboard event) is synchronous (at least once the event for
        // the user action has been dispatched), but closing (a) in response to
        // the `openMenuIDsPath` state change would be asynchronous.
        flushSync(() => {
            setOpenMenuIDsPath((prevIDs) => {

                if (prevIDs[prevIDs.length - 1] === submenuID) {
                    logger.debug(
                        `openSubmenu: submenu with ID ${submenuID} is already ` +
                        "open as the last submenu in the path; not opening " +
                        "again"
                    );
                    return prevIDs;
                }

                // the submenuID that we want to open may be a non-direct child
                // of one of the currently open submenus, meaning we also have
                // to add all of the ancestors of that submenu to the open
                // submenu IDs
                const newIDs = menuItemTreeRef.current.pathToChild(submenuID);
                if (newIDs.length === 0) {
                    logger.error(
                        `openSubmenu: submenu with ID ${submenuID} not found ` +
                        "in menu item tree:\n" +
                        `${menuItemTreeRef.current.toTreeString()}`
                    );
                    return prevIDs;
                }

                logger.debug(
                    `openSubmenu: newIDs: ${newIDs}`
                );
                return newIDs;
            });
        });

    },
        [
            isOpen,
            setOpenMenuIDsPath,
            setIsOpen
        ]
        // [
        //     "isOpen",
        //     "setOpenMenuIDsPath",
        //     "setIsOpen"
        // ],
        // (changes) => {
        //     logger.debug(
        //         "useCallbackDebug: openSubmenu: changes:\n",
        //         changes
        //     );
        // }
    );

    const closeSubmenu = useCallback((
        submenuID: string
    ): void => {

        logger.debug(
            `closeSubmenu: submenuID: ${submenuID}`
        );

        setOpenMenuIDsPath((prevIDs) => {

            if (!prevIDs.includes(submenuID)) {
                logger.debug(
                    `closeSubmenu: submenu with ID ${submenuID} is not open; ` +
                    "not closing"
                );
                return prevIDs;
            }

            // if the submenuID is the root menu, close the entire dropdown
            if (submenuID === menuID) {
                // not really what this method is intended for, but we can
                // easily handle this case
                logger.debug(
                    `closeSubmenu: submenu with ID ${submenuID} is the root ` +
                    "menu; requesting close all menus"
                );
                setIsOpen(false);
                // If the open/close state is controlled externally, then the
                // parent component could block the close request, so we do NOT
                // change the open IDs path here. Instead, if the menu does
                // actually close, then the `openMenuIDsPath` will be set to
                // `[]` in the `closeDropdownMenuEffectEvent` effect event.
                return prevIDs;
            }

            const parent = menuItemTreeRef.current.parentOf(submenuID);
            if (!parent) {
                logger.error(
                    `closeSubmenu: parent of submenu with ID ${submenuID} ` +
                    "not found in menu item tree:\n" +
                    `${menuItemTreeRef.current.toTreeString()}`
                );
                return prevIDs;
            }
            const newIds = menuItemTreeRef.current.pathToChild(parent.id);
            if (newIds.length === 0) {
                // this should never happen as we have already verified that the
                // parent exists in the menu item tree
                logger.error(
                    "closeSubmenu: could not find path to child for parent " +
                    `${parent.id} of submenu ${submenuID}; menuItemTree:\n` +
                    `${menuItemTreeRef.current.toTreeString()}`
                );
                return prevIDs;
            }

            logger.debug(
                `closeSubmenu: newIds: ${newIds}`
            );

            return newIds;
        });
    }, [
        setIsOpen,
        menuID,
        setOpenMenuIDsPath
    ]);

    const openDropdownMenuEffectEvent = useEffectEvent((): void => {
        logger.debug(
            `openDropdownMenu: id: ${menuID}`
        );

        if (didFinishOpenRef.current) {
            logger.debug(
                `openDropdownMenu: menu with ID ${menuID} is already open; ` +
                "not opening again"
            );
            return;
        }

        dropdownMenuRef.current?.scrollTo(0, 0);
        dropdownMenuMeasuringContainerRef.current?.classList.add(
            "bd-dropdown-menu-measuring-container-show"
        );

        menuItemsAlignmentRef.current.clear();
        menuItemsAlignmentRef.current.set(menuID, "right");

        // if there is a pending request to open a submenu, then we should not
        // update the `openMenuIDsPath` until after we have handled the pending
        // submenu open request, which will happen in `openSubmenu`
        if (!pendingOpenSubmenuIDRef.current) {
            setOpenMenuIDsPath([menuID]);
        }

        positionDropdownMenu();

        if (pendingOpenSubmenuIDRef.current) {
            openSubmenu(pendingOpenSubmenuIDRef.current);
            clearPendingOpenSubmenuRequest();
        }

        didFinishOpenRef.current = true;
    });

    const closeDropdownMenuEffectEvent = useEffectEvent((): void => {
        logger.debug(
            `closeDropdownMenu: id: ${menuID}`
        );

        if (!didFinishOpenRef.current) {
            logger.debug(
                `closeDropdownMenu: menu with ID ${menuID} is already ` +
                "closed; not closing again"
            );
            return;
        }

        const dropdownMenuMeasuringContainer =
            dropdownMenuMeasuringContainerRef.current;

        if (!dropdownMenuMeasuringContainer) {
            logger.error(
                "closeDropdownMenu: dropdownMenuMeasuringContainer is null"
            );
            return;
        }

        dropdownMenuMeasuringContainer.classList.remove(
            "bd-dropdown-menu-measuring-container-show"
        );

        clearPendingOpenSubmenuRequest();
        setOpenMenuIDsPath([]);
        setHoveredMenuItem(null);
        menuItemsAlignmentRef.current.clear();
        ignoreClicksUntilNextPointerDownRef.current = false;
        if (repositionMenusRafIdRef.current !== null) {
            cancelAnimationFrame(repositionMenusRafIdRef.current);
            repositionMenusRafIdRef.current = null;
        }
        if (buildMenuItemTreeRafIdRef.current !== null) {
            cancelAnimationFrame(buildMenuItemTreeRafIdRef.current);
            buildMenuItemTreeRafIdRef.current = null;
        }
        ignoreInitialResizeObserverCallbackRef.current = false;

        dropdownMenuMeasuringContainerSizeRef.current = null;
        dropdownMenuContentSizeRef.current = null;
        didFinishOpenRef.current = false;
    });

    const handleClick = useCallback((
        event: ReactMouseEvent<HTMLDivElement, MouseEvent>
    ): void => {

        logger.debug("handleClick; event.target:", event.target);

        if (ignoreClicksUntilNextPointerDownRef.current) {
            logger.debug(
                "handleClick: pointer has not gone down since scroll arrow " +
                "disappeared; ignoring click"
            );
            ignoreClicksUntilNextPointerDownRef.current = false;

            event.preventDefault();
            event.stopPropagation();
            event.nativeEvent.stopImmediatePropagation();

            return;
        }

        const dropdownMenu = dropdownMenuRef.current;
        if (!dropdownMenu) {
            logger.warn(
                "handleClick: dropdownMenu is null"
            );
            return;
        }

        toggleDropdownMenu(event);

    }, [
        toggleDropdownMenu
    ]);

    /**
     * Returns all dropdown items in the innermost open dropdown menu,
     * regardless of whether it is focused.
     */
    const getCurrentMenuDropdownItems = useCallback((): HTMLElement[] => {

        const dropdownMenu = dropdownMenuRef.current;
        if (!dropdownMenu || !submenusPortalContainer) {
            logger.warn(
                "getAllDropdownItems: dropdownMenu or " +
                "submenusPortalContainer is null"
            );
            return [];
        }
        const openMenuIDsPath = openMenuIDsPathRef.current;
        const openSubmenuID = openMenuIDsPath[openMenuIDsPath.length - 1];
        if (openSubmenuID && openSubmenuID !== menuID) {
            const submenu = submenusPortalContainer.querySelector(
                `.bd-dropdown-submenu[data-submenu-id="${openSubmenuID}"]`
            );
            if (!submenu) {
                logger.debug(
                    `getAllDropdownItems: submenu with ID ${openSubmenuID} not found`
                );
                return [];
            }
            return Array.from(
                submenu.querySelectorAll(".bd-dropdown-item-container")
            );
        }
        else {
            return Array.from(
                dropdownMenu.querySelectorAll(".bd-dropdown-item-container")
            );

        }
    }, [
        openMenuIDsPathRef,
        submenusPortalContainer,
        menuID
    ]);

    /**
     * Focuses the first item in the submenu of the given dropdown item.
     *
     * Returns whether or not the dropdown item has a submenu with an item that
     * could be focused.
     */
    const focusFirstSubmenuItem = useCallback((
        submenuID: string,
    ): boolean => {

        if (!submenusPortalContainer) {
            logger.warn(
                "focusFirstSubmenuItem: submenusPortalContainer is null"
            );
            return false;
        }

        const submenuItems = submenusPortalContainer.querySelectorAll(
            `.bd-dropdown-submenu[data-submenu-id="${submenuID}"] ` +
            ".bd-dropdown-item-container"
        );

        if (submenuItems.length === 0) {
            logger.debug(
                `focusFirstSubmenuItem: submenu with ID ${submenuID} has no ` +
                "items"
            );
            return false;
        }

        const firstSubmenuItem = submenuItems[0]!;
        if (!(firstSubmenuItem instanceof HTMLElement)) {
            logger.debug(
                "focusFirstSubmenuItem: first submenu item of submenu with " +
                `ID ${submenuID} is not an HTMLElement:`, firstSubmenuItem
            );
            return false;
        }

        // the menu may have just opened and may be positioned outside the
        // viewport, so prevent scrolling when focusing
        firstSubmenuItem.focus({ preventScroll: true });
        logger.debug(
            "focusFirstSubmenuItem: focused first submenu item with ID " +
            `${submenuID}:`, firstSubmenuItem
        );

        return true;
    }, [submenusPortalContainer]);

    /**
     * Focuses the parent dropdown item for the given submenu ID.
     */
    const focusSubmenuDropdownItem = useCallback((
        submenuID: string
    ): void => {

        const dropdownMenu = dropdownMenuRef.current;

        if (!submenusPortalContainer || !dropdownMenu) {
            logger.warn(
                "focusSubmenuDropdownItem: submenusPortalContainer or " +
                "dropdownMenu is null"
            );
            return;
        }

        const selector = `.bd-dropdown-item-container[data-submenu-id="${submenuID}"]`;

        // the submenusPortalContainer does not contain the main dropdown menu
        // so we have to check both it and the main dropdown menu
        const dropdownItem = dropdownMenu.querySelector<HTMLElement>(selector)
            ?? submenusPortalContainer.querySelector<HTMLElement>(
                selector
            );

        if (!dropdownItem) {
            logger.debug(
                "focusSubmenuDropdownItem: dropdown item with submenu ID " +
                `${submenuID} not found`
            );
            return;
        }

        logger.debug(
            "focusSubmenuDropdownItem: focusing dropdown item with submenu ID" +
            `${submenuID}:`,
            dropdownItem
        );
        dropdownItem.focus();
    }, [submenusPortalContainer]);

    const handleKeyDownEffectEvent = useEffectEvent((
        event: KeyboardEvent
    ): void => {

        if (!enableKeyEvents) {
            return;
        }

        if (!isOpen) {
            logger.debug("handleKeyDown: dropdown menu is not open; ignoring");
            return;
        }

        logger.debug("handleKeyDown");

        const dropdownMenu = dropdownMenuRef.current;
        if (!dropdownMenu) {
            logger.warn(
                "handleKeyDown: dropdownMenu is null"
            );
            return;
        }

        const dropdown = dropdownRef.current;
        if (!dropdown) {
            logger.warn(
                "handleKeyDown: dropdown is null"
            );
            return;
        }

        const dropdownIsFocused =
            document.activeElement &&
            (
                dropdown.contains(document.activeElement) ||
                submenusPortalContainer?.contains(document.activeElement)
            );

        if (event.key === "Escape") {
            logger.debug("handleKeyDown: Escape");
            event.preventDefault();
            setIsOpen(false, event);
        }
        else if (!dropdownIsFocused) {
            logger.debug(
                "handleKeyDown: dropdown menu is not focused; ignoring"
            );
            return;
        }
        // MARK: the below keyboard interactions only apply when the dropdown
        //  is focused
        else if (
            event.key === "Enter"
        ) {
            logger.debug("handleKeyDown: Enter");
            const focusedItem = document.activeElement;

            if (
                !(focusedItem instanceof HTMLElement) ||
                !focusedItem.classList.contains("bd-dropdown-item-container")
            ) {
                return;
            }

            event.preventDefault();
            ignoreClicksUntilNextPointerDownRef.current = false;
            focusedItem.click();

            const submenuID = focusedItem.dataset.submenuId;
            const hasSubmenu = focusedItem.dataset.hasSubmenu === "true";

            if (submenuID && hasSubmenu) {
                focusFirstSubmenuItem(submenuID);
            }
            else {
                logger.debug(
                    "handleKeyDown: Enter: no submenu ID; returning"
                );
            }

        }
        else if (
            event.key === "ArrowDown" ||
            (event.key === "Tab" && !event.shiftKey)
        ) {
            event.preventDefault();
            const items = getCurrentMenuDropdownItems();
            if (items.length === 0) {
                logger.warn(
                    "handleKeyDown: no items in dropdown menu"
                );
                return;
            }

            logger.debug(
                "handleKeyDown: dropdown items:",
                items
            );

            // length is at least 1 here
            const firstItem = items[0]!;
            const lastItem = items[items.length - 1]!;
            const focusedItem = document.activeElement;

            if (
                focusedItem === lastItem ||
                items.every((item) => item !== focusedItem)
            ) {
                firstItem.focus();
            }
            else {
                const focusedItemIndex = items.findIndex(
                    (item) => item === focusedItem
                );
                if (focusedItemIndex !== -1) {
                    const nextItem = items[focusedItemIndex + 1];
                    if (nextItem) {
                        nextItem.focus();
                    }
                }
            }
        }
        else if (
            event.key === "ArrowUp" ||
            (event.key === "Tab" && event.shiftKey)
        ) {
            event.preventDefault();
            const items = getCurrentMenuDropdownItems();
            if (items.length === 0) {
                logger.warn(
                    "handleKeyDown: no items in dropdown menu"
                );
                return;
            }

            logger.debug(
                "handleKeyDown: dropdown items:",
                items
            );

            // length is at least 1 here
            const firstItem = items[0]!;
            const lastItem = items[items.length - 1]!;
            const focusedItem = document.activeElement;

            if (
                focusedItem === firstItem ||
                items.every((item) => item !== focusedItem)
            ) {
                lastItem.focus();
            }
            else {
                const focusedItemIndex = items.findIndex(
                    (item) => item === focusedItem
                );
                if (focusedItemIndex !== -1) {
                    const prevItem = items[focusedItemIndex - 1];
                    if (prevItem) {
                        prevItem.focus();
                    }
                }
            }
        }
        else if (event.key === "ArrowRight") {
            logger.debug("handleKeyDown: ArrowRight");

            const focusedItem = document.activeElement;
            if (!(focusedItem instanceof HTMLElement)) {
                return;
            }

            const submenuID = focusedItem.dataset.submenuId;
            const hasSubmenu = focusedItem.dataset.hasSubmenu === "true";
            if (!submenuID || !hasSubmenu) {
                logger.debug(
                    "handleKeyDown: ArrowRight: no submenu ID; returning"
                );
                return;
            }

            event.preventDefault();

            ignoreClicksUntilNextPointerDownRef.current = false;

            focusedItem.click();

            focusFirstSubmenuItem(submenuID);

        }
        else if (event.key === "ArrowLeft") {
            logger.debug("handleKeyDown: ArrowLeft");

            if (openMenuIDsPath.length <= 1) {
                logger.debug(
                    "handleKeyDown: ArrowLeft: no open submenus; returning"
                );
                return;
            }

            const openSubmenuID = openMenuIDsPath[openMenuIDsPath.length - 1];
            if (openSubmenuID) {
                event.preventDefault();
                closeSubmenu(openSubmenuID);
                focusSubmenuDropdownItem(openSubmenuID);
            }
        }

    });

    useImperativeHandle(handle, (): DropdownMenuHandle => ({
        openSubmenu,
        closeSubmenu,
        // return a copy of the openMenuIDsPath to prevent external mutation of
        // the internal state
        getOpenMenuIDsPath: () => [...openMenuIDsPathRef.current],
        clearPendingOpenSubmenuRequest
    }), [
        openSubmenu,
        closeSubmenu,
        openMenuIDsPathRef,
        clearPendingOpenSubmenuRequest
    ]);

    // MARK: Effect Events

    // using these effect event wrappers to prevent the effects from running
    // more often than necessary due to changes in non-reactive values

    const buildMenuItemTreeEffectEvent = useEffectEvent(buildMenuItemTree);

    const scheduleDropdownMenuRepositionEffectEvent = useEffectEvent(
        scheduleDropdownMenuReposition
    );

    const onOpenMenusChangeEffectEvent = useEffectEvent(
        onOpenMenusChange ?? ((): void => { })
    );

    // MARK: useEffect: change to isOpen
    useEffect((/* changes */) => {

        logger.debug(
            "useEffect: isOpen:", isOpen
            // "\nchanges:", changes,
            // "\nopenDropdownMenu._debug:", openDropdownMenu._debug,
            // "\npositionDropdownMenu._debug:", positionDropdownMenu._debug
        );

        // use a microtask because the code that opens and positions the menu
        // calls flushSync (in order to ensure atomic layout updates), which
        // must not be called inside a useEffect callback
        queueMicrotask(() => {
            if (isOpen) {
                openDropdownMenuEffectEvent();
            }
            else if (!isOpen) {
                closeDropdownMenuEffectEvent();
            }
        });

    },
        [
            isOpen
        ]
        // [
        //     "isOpen"
        // ]
    );

    // MARK: useEffect: change to openMenuIDsPath
    useEffect(() => {
        logger.debug(
            "useEffect: openMenuIDsPath changed; new path:", openMenuIDsPath
        );
        onOpenMenusChangeEffectEvent([...openMenuIDsPath]);
    }, [
        openMenuIDsPath
    ]);

    // MARK: useEffect: Click outside
    useEffect(() => {
        logger.debug("useEffect: click outside begin");

        if (!closeOnClickOutside) {
            return;
        }

        function onClickOutside(event: MouseEvent): void {

            if (ignoreClicksUntilNextPointerDownRef.current) {
                logger.debug(
                    "onClickOutside: pointer has not gone down since scroll " +
                    "arrow disappeared; ignoring click"
                );
                ignoreClicksUntilNextPointerDownRef.current = false;

                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();

                return;
            }

            if (!didFinishOpenRef.current) {
                logger.debug(
                    "onClickOutside: dropdown menu has not finished opening; " +
                    "ignoring click"
                );
                return;
            }

            const dropdown = dropdownRef.current;
            if (!dropdown) {
                logger.warn(
                    "onClickOutside: dropdown is null"
                );
                return;
            }

            if (
                !dropdown.contains(event.target as Node)
            ) {
                logger.debug(
                    "onClickOutside: hiding dropdown menu; target:",
                    event.target
                );
                setIsOpen(false, event);
            }
            else {
                logger.debug(
                    "onClickOutside: inside dropdown; not hiding; target:",
                    event.target
                );
            }

        }

        if (isOpen) {
            // use setTimeout to delay adding the event listener until after
            // the current call stack is complete, to avoid immediately
            // triggering the listener from the click that opened the menu
            setTimeout(() => {
                window.addEventListener("click", onClickOutside);
            }, 0);
        }

        return (): void => {
            window.removeEventListener("click", onClickOutside);
        };

    }, [
        isOpen,
        setIsOpen,
        closeOnClickOutside
    ]);

    // MARK: useEffect: keydown
    useEffect(() => {

        if (isOpen) {
            window.addEventListener("keydown", handleKeyDownEffectEvent);
        }

        return (): void => {
            window.removeEventListener("keydown", handleKeyDownEffectEvent);
        };

    }, [isOpen]);

    // MARK: useEffect: Viewport changes
    useEffect(() => {
        logger.debug("useEffect: viewport changes begin");

        function handleVisualViewportChange(
            event: Event
        ): void {

            let thisName: string;
            switch (event.currentTarget) {
                case window:
                    thisName = "window";
                    break;
                case visualViewport:
                    thisName = "visualViewport";
                    break;
                default:
                    thisName = "unknown";
            }

            logger.debug(
                "handleVisualViewportChange: visual viewport changed: " +
                `event.type: ${thisName}.${event.type}; scheduling dropdown ` +
                "menu reposition"
            );
            scheduleDropdownMenuRepositionEffectEvent();
        }

        if (isOpen) {
            window.addEventListener("scroll", handleVisualViewportChange);
            // window.addEventListener("resize", handleVisualViewportChange);
            visualViewport?.addEventListener("resize", handleVisualViewportChange);
            visualViewport?.addEventListener("scroll", handleVisualViewportChange);
        }

        return (): void => {
            window.removeEventListener("scroll", handleVisualViewportChange);
            // window.removeEventListener("resize", handleVisualViewportChange);
            visualViewport?.removeEventListener("resize", handleVisualViewportChange);
            visualViewport?.removeEventListener("scroll", handleVisualViewportChange);
        };

    }, [
        isOpen
    ]);

    // MARK: useEffect: MutationObserver and ResizeObserver
    useEffect(() => {

        const mutationObserverOptions: MutationObserverInit = {
            childList: true,
            subtree: true,
            attributeFilter: [
                "data-submenu-id"
            ]
        };

        logger.debug(
            "useEffect: MutationObserver/ResizeObserver begin; isOpen:", isOpen
        );


        const mutationObserver = new MutationObserver((): void => {
            logger.debug(
                "useEffect: MutationObserver: DOM changed; " +
                "rebuilding menu item tree"
            );
            scheduleBuildMenuItemTreeEffectEvent();
        });

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
                    "not change; not repositioning dropdown menu"
                );
            }
            else {
                logger.debug(
                    "useEffect: ResizeObserver: dropdown menu resized; " +
                    "repositioning dropdown menu"
                );

                scheduleDropdownMenuRepositionEffectEvent();
            }

        });

        if (submenusPortalContainer) {
            // we must build the menu item tree even if the dropdown menu is
            // currently closed because the client could still call
            // `openSubmenu`, which needs the menu item tree to find the submenu
            // to open

            // in case there is a mutation between when the cleanup function of
            // this effect runs and when the new observers are set up
            buildMenuItemTreeEffectEvent();

            mutationObserver.observe(
                submenusPortalContainer,
                mutationObserverOptions
            );
            logger.debug(
                "useEffect: MutationObserver observing " +
                "submenusPortalContainer for mutations:",
                submenusPortalContainer
            );
        }
        else {
            logger.info(
                "useEffect: submenusPortalContainer is null; " +
                "not observing for mutations"
            );
        }

        if (isOpen) {

            if (
                dropdownMenuMeasuringContainerRef.current &&
                dropdownMenuContentRef.current
            ) {

                mutationObserver.observe(
                    dropdownMenuMeasuringContainerRef.current,
                    mutationObserverOptions
                );

                ignoreInitialResizeObserverCallbackRef.current = true;
                resizeObserver.observe(
                    dropdownMenuMeasuringContainerRef.current
                );
                // We must also observe changes to the dropdown menu content,
                // because changes to its size may not always affect the size of
                // the measuring container: For example, if the content size
                // increases (e.g., by adding dropdown items), but the measuring
                // container already has a set max height, then its size will
                // not change. Also, if the content size is already larger than
                // the scroll port of the measuring container and additional
                // content is added, then we need to notify the custom scroll
                // bar to change its geometry
                resizeObserver.observe(
                    dropdownMenuContentRef.current
                );
            }
            else {
                logger.warn(
                    "useEffect: dropdownMenuMeasuringContainerRef or " +
                    "dropdownMenuContentRef is null; not observing for resizes"
                );
            }
        }

        return (): void => {
            logger.debug(
                "useEffect: MutationObserver/ResizeObserver cleanup: " +
                "disconnecting observers"
            );
            mutationObserver.disconnect();
            resizeObserver.disconnect();
        };

    }, [
        isOpen,
        submenusPortalContainer
    ]);

    // MARK: useEffect: Debug expose dropdown menu API on window object
    useEffect(() => {

        if (debugConfig.exposeDebugUtilitiesOnWindow) {
            if (isOpen) {
                window.openSubmenu = openSubmenu;
                window.closeSubmenu = closeSubmenu;
                window.getOpenMenuIDs = (): string[] =>
                    [...openMenuIDsPathRef.current];
                window.getMenuItemTree = (): MenuItemNode =>
                    menuItemTreeRef.current;
                window.buildMenuItemTree = buildMenuItemTree;
                window.positionDropdownMenu = positionDropdownMenu;
            }
            else {
                const error = Error("no dropdown menu is open");

                const names = [
                    "openSubmenu",
                    "closeSubmenu",
                    "getOpenMenuIDs",
                    "getMenuItemTree",
                    "buildMenuItemTree",
                    "positionDropdownMenu"
                ] as const;

                for (const name of names) {
                    window[name] = (): never => {
                        throw error;
                    };
                }
            }
        }
        else {
            delete window.openSubmenu;
            delete window.closeSubmenu;
            delete window.getOpenMenuIDs;
            delete window.getMenuItemTree;
            delete window.buildMenuItemTree;
            delete window.positionDropdownMenu;
        }

    }, [
        isOpen,
        closeSubmenu,
        openSubmenu,
        openMenuIDsPathRef,
        buildMenuItemTree,
        positionDropdownMenu,
        debugConfig.exposeDebugUtilitiesOnWindow
    ]);

    // MARK: useEffect: Cleanup on unmount
    useEffect(() => {
        return (): void => {
            if (repositionMenusRafIdRef.current !== null) {
                cancelAnimationFrame(repositionMenusRafIdRef.current);
                repositionMenusRafIdRef.current = null;
            }
            if (buildMenuItemTreeRafIdRef.current !== null) {
                cancelAnimationFrame(buildMenuItemTreeRafIdRef.current);
                buildMenuItemTreeRafIdRef.current = null;
            }
        };
    }, []);

    // MARK: useLayoutEffect: log commits
    useLayoutEffect(() => {
        logger.debug(
            "useLayoutEffect: commit; isOpen:", isOpen
        );
    });

    // MARK: DEBUG: open dropdown menu on mount
    // useEffect(() => {
    //     openDropdownMenu();
    // }, [openDropdownMenu]);

    const dropdownMenuContextValue = useMemo(
        (): DropdownMenuContextType => ({
            isOpen,
            submenusPortalContainer,
            menuItemTreeRef,
            menuItemsAlignmentRef,
            mainDropdownMenuEventEmitter,
            openMenuIDsPath,
            openMenuIDsPathRef,
            hoveredMenuItemRef,
            setHoveredMenuItem,
            scheduleDropdownMenuReposition,
            openSubmenu,
            closeSubmenu,
            ignoreClicksUntilNextPointerDownRef,
            mouseHoverEvents,
            closeOnClickLeafItem
        }),
        [
            isOpen,
            submenusPortalContainer,
            mainDropdownMenuEventEmitter,
            openMenuIDsPath,
            openMenuIDsPathRef,
            setHoveredMenuItem,
            scheduleDropdownMenuReposition,
            openSubmenu,
            closeSubmenu,
            mouseHoverEvents,
            closeOnClickLeafItem
        ]
    );

    const dropdownSubmenuContextValue = useMemo(
        (): DropdownSubmenuContextType => ({
            parentMenuIsOpen: isOpen,
            parentDropdownMenuMeasuringContainerRef:
                dropdownMenuMeasuringContainerRef,
            customScrollbarRef,
            scrollbarHitbox
        }),
        [
            isOpen,
            scrollbarHitbox
        ]
    );

    return (
        <DropdownMenuContext.Provider
            value={dropdownMenuContextValue}
        >
            <div
                className="bd-dropdown"
                ref={dropdownRef}
                onClick={handleClick}
            >
                <button
                    ref={dropdownToggleRef}
                    className="bd-dropdown-toggle"
                    title={
                        debugConfig.showMenuIds
                            ? menuID
                            : undefined
                    }
                >
                    <i className="fa fa-ellipsis-v px-2"></i>
                </button>
                {debugConfig.showMenuIds && (
                    <span
                        className="bd-dropdown-main-debug-id"
                    >
                        {menuID}
                    </span>
                )}
                {/* the measuring container is necessary so that the width of
                    the scroll bar can be measured */}
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
                            <DropdownSubmenuContext.Provider
                                value={dropdownSubmenuContextValue}
                            >
                                {children}
                            </DropdownSubmenuContext.Provider>
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
            </div>
            {/* Create a single portal container for all submenus to appear
                inside of so that they can all be discovered without running a
                query selector on the entire document */}
            {createPortal((
                <div
                    className="bd-submenus-portal-container"
                    id={menuID}
                    ref={setSubmenusPortalContainer}
                />
            ),
                document.body
            )}
        </DropdownMenuContext.Provider>
    );

});

// use any to exclude from the generated .d.ts file
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
(_DropdownMenu as any).displayName = "DropdownMenu";

/**
 * A dropdown menu component that can contain dropdown items and arbitrarily
 * nested submenus. The dropdown menu is opened by clicking on the toggle
 * button, and can be closed by clicking outside of the menu or by pressing the
 * Escape key. The menu supports keyboard navigation and will automatically
 * reposition itself to stay within the visual viewport.
 *
 * @param props - The props for this component. See {@link DropdownMenuProps}
 * for details.
 *
 * @public
 */
export const DropdownMenu = _DropdownMenu as
    (props: DropdownMenuProps) => ReactNode;
