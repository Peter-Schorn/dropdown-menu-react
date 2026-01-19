import "./DropdownMenu.css";

import React, {
    type JSX,
    type PropsWithChildren,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    memo,
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
} from "../model/DropdownMenuContext";
import {
    type DropdownSubmenuContextType,
    DropdownSubmenuContext
} from "../model/DropdownSubmenuContext";
import { MenuItemNode } from "../model/MenuItemNode";
import {
    DropdownMenuEventEmitter,
    DropdownMenuEventType,
} from "../model/DropdownMenuEventEmitter";

import {
    DROPDOWN_IDEAL_MIN_WIDTH
} from "../utils/constants";

import { useDebugConfig } from "../hooks/useDebugConfig";

import {
    type HorizontalEdge,
    isWebkit,
    clamp,
    domRectsAreEqual
} from "../utils/MiscellaneousUtilities";

// import {
//     useEffectDebug
// } from "../../hooks/useEffectDebug";

// import {
//     useCallbackDebug
// } from "../../hooks/useCallbackDebug";

import { dropdownMenuLogger as logger } from "../utils/loggers";

export type DropdownMenuProps = PropsWithChildren /* & { } */;

export const DropdownMenu = memo(function DropdownMenu(props: DropdownMenuProps): JSX.Element {

    logger.debug("DropdownMenu: render");

    const debugConfig = useDebugConfig();

    const {
        children
    } = props;

    const [isOpen, setIsOpen] = useState(false);

    const [
        submenusPortalContainer,
        setSubmenusPortalContainer
    ] = useState<HTMLDivElement | null>(null);

    const [openMenuIDsPath, setOpenMenuIDsPath] = useState<string[]>([]);

    const [
        scrollbarHitbox,
        setScrollbarHitbox
    ] = useState<HTMLDivElement | null>(null);

    const [
        hoveredMenuItem,
        setHoveredMenuItem
    ] = useState<string | null>(null);

    const [
        disableMouseHoverEvents,
        setDisableMouseHoverEvents
    ] = useState<boolean>(true);

    const menuID = useMemo(
        () => crypto.randomUUID(),
        []
    );

    const mainDropdownMenuEventEmitter = useMemo(
        () => new DropdownMenuEventEmitter(),
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
     * Used to ignore the initial callback from the ResizeObserver, which
     * occurs when the observer is first created. The useEffect that creates
     * the ResizeObserver will rerun when certain dependencies change, which
     * will recreate the ResizeObserver and trigger the initial callback even
     * if the size has not changed.
     */
    const ignoreInitialResizeObserverCallbackRef = useRef<boolean>(false);

    const getSubmenuItemTree = useCallback((
        submenuID: string
    ): MenuItemNode => {

        const node = new MenuItemNode({
            id: submenuID
        });

        if (!submenusPortalContainer) {
            logger.warn(
                "getMenuItemChildren: submenusPortalContainer is null"
            );
            return node;
        }

        const submenu = submenusPortalContainer.querySelector<HTMLElement>(
            `.bd-dropdown-submenu[data-submenu-id="${submenuID}"]`
        );
        if (!submenu) {
            logger.debug(
                `getMenuItemChildren: submenu with ID ${submenuID} not found`
            );
            return node;
        }

        const submenuItems = submenu.querySelectorAll<HTMLElement>(
            ".bd-dropdown-item-container"
        );

        for (const menuItem of submenuItems) {
            const submenuID = menuItem.getAttribute("data-submenu-id");
            if (!submenuID) {
                // no submenu;
                continue;
            }
            // has submenu; get its children recursively
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
            const submenuID = menuItem.getAttribute("data-submenu-id");
            if (!submenuID) {
                continue;
            }

            const submenuNode = getSubmenuItemTree(submenuID);

            menuItemTree.addChild(submenuNode);

        }

        menuItemTreeRef.current = menuItemTree;
        logger.debug(
            "buildMenuItemTree: built menu item tree:\n",
            menuItemTree.toTreeString()
        );

    }, [
        getSubmenuItemTree,
        menuID
    ]);

    const scheduleBuildMenuItemTree = useCallback((): void => {

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

    }, [buildMenuItemTree]);

    /**
     * Notifies the submenus that they should reposition themselves. This
     * should only occur after the main dropdown menu has finished positioning
     * itself, because the position of the submenus is relative to the
     * position of the main dropdown menu. Furthermore, the position of each
     * submenu is relative to the position of its parent menu item, so
     * the request for each submenu to reposition itself should occur in the
     * order of the depth of the submenus in the menu item tree.
     */
    const requestRepositionSubmenus = useCallback((): void => {

        if (openMenuIDsPath.length <= 1) {
            logger.debug(
                "requestRepositionSubmenus: no open submenus; nothing to do"
            );
            return;
        }

        logger.debug(
            "requestRepositionSubmenus: queuing reposition of submenus"
        );

        const submenuIDs = openMenuIDsPath.slice(1);

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
        openMenuIDsPath
    ]);

    const positionDropdownMenu = useCallback((): void => {

        const performanceMarkDetail = {
            menuID: menuID,
            openMenuIDsPath: openMenuIDsPath
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
         * The vertical padding inside the dropdown menu container: Reflects
         * the difference between the height of the dropdown menu measuring
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
         * bars. Represents the total height that would be needed to display
         * the entire dropdown menu.
         */
        const idealDropdownMenuContainerHeight =
            dropdownMenuContentRect.height
            + dropdownMenuContainerVerticalPadding;

        /**
         * The bottom of the dropdown menu if the height was not constrained
         * to be above the bottom of the visual viewport and there were no
         * scroll bars.
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

            // MARK: Ensure menu does not overflow the *VISUAL* viewport

            logger.debug(
                "positionDropdownMenu: aligning bottom edge of menu to " +
                "top edge of dropdown toggle"
            );

            /**
             * The ideal top offset to align the bottom of the dropdown
             * menu to the top of the dropdown toggle.
             */
            const idealTopOffset = -idealDropdownMenuContainerHeight;

            /**
             * The minimum top offset that would prevent the top of the
             * dropdown menu from overflowing the top of the visual viewport
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

            // MARK: Ensure menu does not overflow the *VISUAL* viewport

            /**
             * The ideal top offset to align the top of the dropdown
             * menu to the bottom of the dropdown toggle.
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
            // this callee is already batched to animation frames and we need
            // an update immediately anyway because the horizontal positioning
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


        // position the left edge of the menu to the left edge of the
        //  dropdown toggle
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

    }, [
        openMenuIDsPath,
        requestRepositionSubmenus,
        menuID
    ]);

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

    const openDropdownMenu = useCallback((): void => {
        logger.debug(
            `openDropdownMenu: id: ${menuID}`
        );
        dropdownMenuRef.current?.scrollTo(0, 0);
        dropdownMenuMeasuringContainerRef.current?.classList.add(
            "bd-dropdown-menu-measuring-container-show"
        );
        menuItemsAlignmentRef.current = new Map<string, HorizontalEdge>([
            [menuID, "right"]
        ]);
        scheduleBuildMenuItemTree();
        setOpenMenuIDsPath([menuID]);
        setIsOpen(true);
        positionDropdownMenu();
    }, [
        scheduleBuildMenuItemTree,
        positionDropdownMenu,
        menuID
    ]);

    const closeDropdownMenu = useCallback((): void => {
        logger.debug(
            `closeDropdownMenu: id: ${menuID}`
        );

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

        setIsOpen(false);
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

    }, [
        menuID,
        setHoveredMenuItem
    ]);

    const openSubmenu = useCallback((
        submenuID: string
    ): void => {

        if (!isOpen) {
            logger.error(
                `openSubmenu: cannot open submenu with ID ${submenuID} ` +
                "because the dropdown menu is not open"
            );
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
                        "open as the last submenu in the path; not opening again"
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
                        `openSubmenu: submenu with ID ${submenuID} not found in ` +
                        "menu item tree:", menuItemTreeRef.current.toPODObject()
                    );
                    return prevIDs;
                }

                logger.debug(
                    `openSubmenu: newIDs: ${newIDs}`
                );
                return newIDs;
            });
        });

    }, [isOpen]);

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

            if (submenuID === menuID) {
                // not really what this method is intended for, but we can
                // easily handle this case
                logger.debug(
                    `closeSubmenu: submenu with ID ${submenuID} is the root menu; ` +
                    "closing all menus"
                );
                closeDropdownMenu();
                return [];
            }

            const parent = menuItemTreeRef.current.parentOf(submenuID);
            if (!parent) {
                logger.error(
                    `closeSubmenu: parent of submenu with ID ${submenuID} ` +
                    "not found in menu item tree"
                );
                return prevIDs;
            }
            const newIds = menuItemTreeRef.current.pathToChild(parent.id);
            if (newIds.length === 0) {
                // this should never happen as we have already verified that the
                // parent exists in the menu item tree
                logger.error(
                    "closeSubmenu: could not find path to child for parent " +
                    `${parent.id} of submenu ${submenuID}; menuItemTree:`,
                    menuItemTreeRef.current.toPODObject()
                );
                return prevIDs;
            }
            logger.debug(
                `closeSubmenu: newIds: ${newIds}`
            );

            return newIds;
        });
    }, [
        closeDropdownMenu,
        menuID
    ]);

    const handleClick = useCallback((
        event: React.MouseEvent<HTMLDivElement, MouseEvent>
    ): void => {

        logger.debug("handleClick");

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

        if (isOpen) {
            closeDropdownMenu();
        }
        else {
            openDropdownMenu();
        }

    }, [
        closeDropdownMenu,
        openDropdownMenu,
        isOpen
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
        openMenuIDsPath,
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

        // the menu may have just opened and may be positioned offscreen, so
        // prevent scrolling when focusing
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

    const handleKeyDown = useCallback((
        event: KeyboardEvent
    ): void => {

        if (debugConfig.disableMenuKeyEvents) {
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

        if (event.key === "Escape") {
            logger.debug("handleKeyDown: Escape");
            event.preventDefault();
            closeDropdownMenu();
        }
        else if (event.key === "Enter") {
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

            const submenuID = focusedItem.getAttribute("data-submenu-id");
            if (submenuID) {
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

            const submenuID = focusedItem.getAttribute("data-submenu-id");
            if (!submenuID) {
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

    }, [
        closeDropdownMenu,
        getCurrentMenuDropdownItems,
        isOpen,
        closeSubmenu,
        openMenuIDsPath,
        focusSubmenuDropdownItem,
        focusFirstSubmenuItem,
        debugConfig.disableMenuKeyEvents
    ]);

    // MARK: useEffect: Click outside
    useEffect(() => {
        logger.debug("useEffect: click outside begin");

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
                logger.debug("onClickOutside: hiding dropdown menu");
                closeDropdownMenu();
            }
            else {
                logger.debug("onClickOutside: inside dropdown; not hiding");
            }

        }

        if (isOpen) {
            window.addEventListener("click", onClickOutside);
        }

        return (): void => {
            window.removeEventListener("click", onClickOutside);
        };

    }, [closeDropdownMenu, isOpen]);

    // MARK: useEffect: keydown
    useEffect(() => {

        if (isOpen) {
            window.addEventListener("keydown", handleKeyDown);
        }

        return (): void => {
            window.removeEventListener("keydown", handleKeyDown);
        };

    }, [handleKeyDown, isOpen]);

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
            scheduleDropdownMenuReposition();
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
        handleKeyDown,
        isOpen,
        scheduleDropdownMenuReposition
    ]);

    // MARK: useEffect: Children changes
    useEffect(() => {
        logger.debug("useEffect: children changes begin");

        if (isOpen) {
            logger.debug(
                "useEffect: children changes: dropdown menu is open; " +
                "rebuilding menu item tree"
            );
            scheduleBuildMenuItemTree();
        }

    }, [
        scheduleBuildMenuItemTree,
        isOpen,
        children
    ]);

    // MARK: useEffect: MutationObserver and ResizeObserver
    useEffect(() => {

        logger.debug("useEffect: MutationObserver/ResizeObserver begin");

        const mutationObserver = new MutationObserver((): void => {
            logger.debug(
                "useEffect: MutationObserver: DOM changed; " +
                "rebuilding menu item tree"
            );
            scheduleBuildMenuItemTree();
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

                scheduleDropdownMenuReposition();
            }

        });

        if (isOpen) {

            if (submenusPortalContainer) {
                mutationObserver.observe(submenusPortalContainer, {
                    childList: true,
                    subtree: true,
                    attributeFilter: [
                        "data-submenu-id"
                    ]
                });
            }
            else {
                logger.warn(
                    "useEffect: submenusPortalContainer is null; " +
                    "not observing for mutations"
                );
            }

            if (
                dropdownMenuMeasuringContainerRef.current &&
                dropdownMenuContentRef.current
            ) {
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
            mutationObserver.disconnect();
            resizeObserver.disconnect();
        };

    }, [
        scheduleBuildMenuItemTree,
        isOpen,
        scheduleDropdownMenuReposition,
        submenusPortalContainer
    ]);

    // MARK: useEffect: Debug expose dropdown menu API on window object
    useEffect(() => {

        if (debugConfig.exposeDebugUtilitiesOnWindow) {
            if (isOpen) {
                window.openSubmenu = openSubmenu;
                window.closeSubmenu = closeSubmenu;
                window.getOpenMenuIDs = (): string[] => openMenuIDsPath;
                window.getMenuItemTree = (): MenuItemNode => menuItemTreeRef.current;
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
        openMenuIDsPath,
        buildMenuItemTree,
        positionDropdownMenu,
        debugConfig.exposeDebugUtilitiesOnWindow
    ]);

    // MARK: useEffect: Disable mouse hover events in debug mode
    useEffect(() => {

        if (isOpen) {

            if (
                debugConfig.disableMenuMouseHoverEvents
            ) {
                logger.debug(
                    "useEffect: disabling mouse hover events"
                );
                setDisableMouseHoverEvents(true);
            }
            else {
                logger.debug(
                    "useEffect: enabling mouse hover events"
                );
                setDisableMouseHoverEvents(false);
            }
        }

    }, [
        isOpen,
        buildMenuItemTree,
        debugConfig.disableMenuMouseHoverEvents
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

    // MARK: DEBUG: open dropdown menu on mount
    // useEffect(() => {
    //     openDropdownMenu();
    // }, [openDropdownMenu]);

    const dropdownMenuContextValue = useMemo<DropdownMenuContextType>(
        () => ({
            isOpen,
            submenusPortalContainer,
            menuItemTreeRef,
            menuItemsAlignmentRef,
            mainDropdownMenuEventEmitter,
            openMenuIDsPath,
            hoveredMenuItem,
            setHoveredMenuItem,
            scheduleDropdownMenuReposition,
            openSubmenu,
            closeSubmenu,
            ignoreClicksUntilNextPointerDownRef,
            disableMouseHoverEvents
        }),
        [
            isOpen,
            submenusPortalContainer,
            openMenuIDsPath,
            hoveredMenuItem,
            setHoveredMenuItem,
            scheduleDropdownMenuReposition,
            openSubmenu,
            closeSubmenu,
            disableMouseHoverEvents,
            mainDropdownMenuEventEmitter
        ]
    );

    const dropdownSubmenuContextValue = useMemo<DropdownSubmenuContextType>(
        () => ({
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
                {/* the measuring container is necessary so that the width
                    of the scroll bar can be measured */}
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
                            ref={dropdownMenuCoreRef}
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
                        ref={customScrollbarRef}
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
                    ref={(node) => {
                        setSubmenusPortalContainer(node);

                        return () => {
                            setSubmenusPortalContainer(null);
                        };
                    }}
                />
            ),
                document.body
            )}
        </DropdownMenuContext.Provider>
    );

});
