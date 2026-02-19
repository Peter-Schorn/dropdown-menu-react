import styles from "./CustomScrollbar.module.css";

import {
    type JSX,
    type RefObject,
    type MouseEvent as ReactMouseEvent,
    useEffect,
    useImperativeHandle,
    useRef,
    useCallback,
    useLayoutEffect,
    useState,
    useMemo,
} from "react";

import {
    createPortal,
    flushSync
} from "react-dom";

import {
    HitboxTestableEvent
} from "../model/HitboxTestableEvent";

import { useDebugConfig } from "../hooks/useDebugConfig";

import {
    clamp,
    isWebkit,
    eventWithinDomRect,
    isPrimarilyTouchDevice
} from "../utils/MiscellaneousUtilities";

import { customScrollbarLogger as logger } from "../utils/loggers";

export type ScheduleGeometryUpdateOptions = {
    /**
     * If `true`, batches multiple geometry updates into a single update per
     * animation frame. If `false`, updates the geometry immediately. Only set
     * to `false` if the caller is already batching multiple updates per
     * animation frame.
     */
    batchToAnimationFrame: boolean;

    /**
     * If `true` (default), repositions the scrollbar hitbox after updating the
     * geometry. Should only be set to `false` if the caller will call
     * `repositionScrollbarHitbox` themselves later (but before next repaint)
     * after calling this method.
     */
    repositionScrollbarHitbox?: boolean;
};

export type CustomScrollbarHandle = {

    /**
     * Called when the geometry of the scroll container has changed so that the
     * scrollbar can update itself accordingly.
     */
    scheduleGeometryUpdate: (
        options: ScheduleGeometryUpdateOptions
    ) => void;

    /**
     * Repositions the scrollbar hitbox based on the current position of the
     * scrollbar track. Should be called when the position of the scrollbar
     * track may have changed.
     */
    repositionScrollbarHitbox: () => void;

};

export type CustomScrollbarProps = {
    /**
     * Whether the container for the scrollbar is itself visible.
     *
     * Used to optimize performance by avoiding unnecessary work when the
     * scrollbar's container is not visible.
     */
    scrollContainerIsVisible: boolean;

    /**
     * A ref to the handle of this custom scrollbar.
     */
    handle: RefObject<CustomScrollbarHandle | null>;

    /**
     * A ref to the wrapper element that contains both the scroll container and
     * this scroll bar itself.
     */
    scrollContainerWrapperRef: RefObject<HTMLElement | null>;

    /**
     * A ref to the scrollable container element that this custom scrollbar is
     * associated with.
     */
    scrollContainerRef: RefObject<HTMLElement | null>;

    scrollbarHitbox: HTMLDivElement | null;
    setScrollbarHitbox: (hitbox: HTMLDivElement | null) => void;

    /**
     * The z-index CSS property of the scroll container that this scroll bar is
     * associated with. Used for rendering the debug hitbox at the correct
     * z-index.
     */
    zIndex: number;
};

export function CustomScrollbar(props: CustomScrollbarProps): JSX.Element {

    /**
     * Padding to expand the hitbox of the scrollbar track for touch events.
     */
    const TOUCH_DOWN_PADDING = 8;
    // const TOUCH_DOWN_PADDING = 20;
    // const TOUCH_DOWN_PADDING = 40;
    // const TOUCH_DOWN_PADDING = 80;
    // const TOUCH_DOWN_PADDING = 0;

    const debugConfig = useDebugConfig();

    const {
        scrollContainerIsVisible,
        handle: handle,
        scrollContainerWrapperRef,
        scrollContainerRef,
        scrollbarHitbox,
        setScrollbarHitbox,
        zIndex
    } = props;

    const hoverColorCSSVar = "var(--hover-color)";

    // whether the scroll bar track will be shown—assuming the scroll container
    // is visible—based on whether the content overflows the scroll container.
    // If the scroll container is not visible, the track will always be hidden.
    const [trackShouldShow, setTrackShouldShow] = useState(false);

    const updateGeometryRafIdRef = useRef<number | null>(null);

    const scrollbarTrackRef = useRef<HTMLDivElement>(null);
    const scrollbarThumbRef = useRef<HTMLDivElement>(null);

    // const scrollbarHitboxRef = useRef<HTMLDivElement>(null);

    const trackHeightRef = useRef<number>(0);
    const thumbHeightRef = useRef<number>(0);

    /** The offset of the top of the thumb from the top of the track. */
    const thumbTopOffsetRef = useRef<number>(0);

    const isDraggingRef = useRef<boolean>(false);

    /** The Y coordinate of the mouse when the dragging started. */
    const dragStartYRef = useRef<number>(0);

    /** The scrollTop of the container when the dragging started. */
    const dragStartScrollTopRef = useRef<number>(0);

    /**
     * The offset of the top of the thumb from the top of the track when the
     * dragging started.
     */
    const dragStartThumbTopOffsetRef = useRef<number>(0);

    /**
     * Indicates whether a drag operation was just completed with a pointer down
     * event. This is used to suppress click events that occur immediately after
     * a drag operation.
     */
    const didEndDragWithPointerDownRef = useRef<boolean>(false);

    /**
     * Whether or not this scroll bar track is actually visible or not.
     *
     * Only true if the both the `scrollContainerIsVisible` prop and
     * `trackShouldShow` state are true. But does NOT take into account whether
     * it is occluded by other elements.
     */
    const isVisible = useMemo((): boolean => {
        return scrollContainerIsVisible && trackShouldShow;
    }, [
        scrollContainerIsVisible,
        trackShouldShow
    ]);

    /**
     * Whether to use an expanded hitbox for the scrollbar track. Only true on
     * primarily touch devices.
     */
    const expandedScrollbarHitboxEnabled = useMemo((): boolean => {
        return (
            !debugConfig.disableExpandedHitbox &&
            (
                isPrimarilyTouchDevice ||
                debugConfig.mouseExpandedHitbox
            )
        );
    }, [
        debugConfig.disableExpandedHitbox,
        debugConfig.mouseExpandedHitbox
    ]);

    logger.debug(
        "render: " +
        `isVisible: ${isVisible}; ` +
        `expandedScrollbarHitboxEnabled: ${expandedScrollbarHitboxEnabled}`
    );

    const getExpandedHitbox = useCallback((
        rect: DOMRect,
        padding: number
    ): DOMRect => {
        return new DOMRect(
            rect.x - padding,
            rect.y - padding,
            rect.width + (2 * padding),
            rect.height + (2 * padding)
        );
    }, []);

    const repositionScrollbarHitbox = useCallback((): void => {

        // we get called directly by the parent even when not visible after it
        // repositions itself
        if (!isVisible || !expandedScrollbarHitboxEnabled) {
            return;
        }

        const scrollbarTrack = scrollbarTrackRef.current;

        if (!scrollbarHitbox || !scrollbarTrack) {
            logger.debug(
                "repositionScrollbarHitbox: missing required refs"
            );
            return;
        }

        logger.debug("repositionScrollbarHitbox:", scrollbarHitbox);

        const scrollbarTrackRect = scrollbarTrack.getBoundingClientRect();

        const expandedHitbox = getExpandedHitbox(
            scrollbarTrackRect,
            TOUCH_DOWN_PADDING
        );

        let offsetLeft: number;
        let offsetTop: number;

        if (isWebkit) {
            offsetLeft = visualViewport?.offsetLeft ?? 0;
            offsetTop = visualViewport?.offsetTop ?? 0;
        }
        else {
            offsetLeft = 0;
            offsetTop = 0;
        }

        // this is a DOM element managed outside of React, so we can mutate it
        // directly
        /* eslint-disable react-hooks/immutability */
        scrollbarHitbox.style.top = `${expandedHitbox.top + offsetTop}px`;
        scrollbarHitbox.style.left = `${expandedHitbox.left + offsetLeft}px`;
        scrollbarHitbox.style.width = `${expandedHitbox.width}px`;
        scrollbarHitbox.style.height = `${expandedHitbox.height}px`;
        /* eslint-enable */
    }, [
        getExpandedHitbox,
        scrollbarHitbox,
        isVisible,
        expandedScrollbarHitboxEnabled
    ]);

    /**
     * Updates the scrollbar thumb position and size based on the scroll
     * container's current scroll position and dimensions. Also hides or shows
     * the scrollbar if the content fits within the scroll container.
     */
    const updateGeometry = useCallback((
        repositionScrollbarHitboxArg = true
    ): void => {

        const scrollContainer = scrollContainerRef.current;
        const scrollbarTrack = scrollbarTrackRef.current;
        const scrollbarThumb = scrollbarThumbRef.current;

        if (!scrollContainer || !scrollbarTrack || !scrollbarThumb) {
            logger.warn(
                "updateGeometry: Missing required refs"
            );
            return;
        }

        const scrollContainerScrollHeight = scrollContainer.scrollHeight;
        const scrollContainerClientHeight = scrollContainer.clientHeight;
        const scrollContainerScrollTop = scrollContainer.scrollTop;

        if (scrollContainerScrollHeight <= scrollContainerClientHeight + 1) {
            // content fits within the scroll container: hide the scrollbar
            setTrackShouldShow(false);
            scrollbarTrack.classList.remove(styles.scrollbarTrackShow);
            return;
        }

        // content overflows the scroll container: show the scrollbar

        // When becoming visible, ensure the state is updated synchronously so
        // that the hitbox, which is only conditionally rendered, is inserted in
        // the DOM and the ref is set before we try to reposition it below when
        // calling `repositionScrollbarHitbox`.
        if (!trackShouldShow) {
            flushSync(() => {
                setTrackShouldShow(true);
            });
        }

        scrollbarTrack.classList.add(styles.scrollbarTrackShow);

        const trackHeight = scrollbarTrack.clientHeight;

        /**
         * The total scroll distance of the scroll container.
         */
        const totalScrollDistance =
            scrollContainerScrollHeight - scrollContainerClientHeight;

        /**
         * The extra scroll height due to rubber banding. This allows for the
         * size of the thumb to shrink appropriately when rubber banding is in
         * effect.
         */
        let rubberBandScrollOffset: number;
        // multiply by 2 to make the thumb size reduce more noticeably, which
        // more closely matches the behavior of the scroll bars on iOS
        if (scrollContainerScrollTop < 0) {
            // rubber banding at top
            rubberBandScrollOffset = Math.abs(scrollContainerScrollTop) * 2;
        }
        else if (
            scrollContainerScrollTop > totalScrollDistance
        ) {
            // rubber banding at bottom
            rubberBandScrollOffset =
                (scrollContainerScrollTop - totalScrollDistance) * 2;
        }
        else {
            // no rubber banding
            rubberBandScrollOffset = 0;
        }

        const theoreticalThumbHeight =
            // percentage of the content visible in the scroll port
            (
                scrollContainerClientHeight /
                (scrollContainerScrollHeight + rubberBandScrollOffset)
            )
            * trackHeight;

        const thumbHeight = Math.max(
            theoreticalThumbHeight,
            25
        );

        /** The distance the thumb can travel. */
        const maxThumbTravel = trackHeight - thumbHeight;

        const theoreticalThumbTop =
            (scrollContainerScrollTop / totalScrollDistance)
            * maxThumbTravel;

        const thumbTop = clamp(theoreticalThumbTop, {
            min: 0,
            max: maxThumbTravel
        });

        trackHeightRef.current = trackHeight;
        thumbHeightRef.current = thumbHeight;
        thumbTopOffsetRef.current = thumbTop;

        scrollbarThumb.style.height = `${thumbHeight}px`;
        scrollbarThumb.style.transform = `translateY(${thumbTop}px)`;

        if (repositionScrollbarHitboxArg) {
            repositionScrollbarHitbox();
        }

        logger.debug(
            "updateGeometry: " +
            `scrollContainerScrollHeight: ${scrollContainerScrollHeight}, ` +
            `scrollContainerClientHeight: ${scrollContainerClientHeight}, ` +
            `scrollContainerScrollTop: ${scrollContainerScrollTop}, ` +
            `trackHeight: ${trackHeight}, ` +
            `theoreticalThumbHeight: ${theoreticalThumbHeight}, ` +
            `thumbHeight: ${thumbHeight}, ` +
            `maxThumbTravel: ${maxThumbTravel}, ` +
            `thumbTop: ${thumbTop}`
        );

    }, [
        scrollContainerRef,
        repositionScrollbarHitbox,
        trackShouldShow
    ]);

    const scheduleGeometryUpdate = useCallback((
        options: ScheduleGeometryUpdateOptions
    ): void => {

        const {
            repositionScrollbarHitbox = true,
            batchToAnimationFrame
        } = options;

        if (batchToAnimationFrame) {
            if (updateGeometryRafIdRef.current === null) {
                updateGeometryRafIdRef.current = requestAnimationFrame(() => {
                    updateGeometryRafIdRef.current = null;
                    updateGeometry(repositionScrollbarHitbox);
                });
            }
        }
        else {
            if (updateGeometryRafIdRef.current !== null) {
                cancelAnimationFrame(
                    updateGeometryRafIdRef.current
                );
                updateGeometryRafIdRef.current = null;
            }
            updateGeometry(repositionScrollbarHitbox);
        }

    }, [updateGeometry]);

    const onDrag = useCallback((event: PointerEvent): void => {

        logger.debug(
            `onDrag: isDraggingRef: ${isDraggingRef.current}; ` +
            `event.type: ${event.type}; ` +
            `event.clientY: ${event.clientY}`
        );

        const scrollContainer = scrollContainerRef.current;

        if (!isDraggingRef.current || !scrollContainer) {
            return;
        }

        event.preventDefault();

        const trackHeight = trackHeightRef.current;
        const thumbHeight = thumbHeightRef.current;
        const maxThumbTravel = trackHeight - thumbHeight;

        if (maxThumbTravel <= 0) {
            return;
        }

        /** The distance dragged since the start of the drag. */
        const deltaY = event.clientY - dragStartYRef.current;

        const scrollHeight = scrollContainer.scrollHeight;
        const clientHeight = scrollContainer.clientHeight;

        /** The total distance the container can scroll. */
        const totalScrollDistance = scrollHeight - clientHeight;

        if (totalScrollDistance <= 0) {
            return;
        }

        const theoreticalNextThumbTop =
            dragStartThumbTopOffsetRef.current + deltaY;

        /**
         * The next thumb top position, clamped to the bounds of the track.
         */
        const nextThumbTop = clamp(theoreticalNextThumbTop, {
            min: 0,
            max: maxThumbTravel
        });

        /**
         * The next scrollTop position corresponding to the next thumb top
         * position.
         */
        const nextScrollTop =
            (nextThumbTop / maxThumbTravel) * totalScrollDistance;

        scrollContainer.scrollTop = nextScrollTop;

    }, [scrollContainerRef]);

    const endDrag = useCallback((
        event?: PointerEvent
    ): void => {

        logger.debug(
            `endDrag: isDraggingRef: ${isDraggingRef.current}; ` +
            `event: ${event?.type}`
        );

        if (!isDraggingRef.current) {
            return;
        }

        event?.preventDefault();

        isDraggingRef.current = false;

        if (event?.type === "pointerup") {

            // If the drag ended with a pointerup event, set the flag to
            // suppress the next click event.
            didEndDragWithPointerDownRef.current = true;
        }

        const scrollbarThumb = scrollbarThumbRef.current;
        if (scrollbarThumb) {
            scrollbarThumb.style.backgroundColor = "";
        }

        window.removeEventListener("pointermove", onDrag);

        // eslint-disable-next-line react-hooks/immutability
        window.removeEventListener("pointerup", endDrag);
        window.removeEventListener("pointercancel", endDrag);

    }, [onDrag]);

    const beginDrag = useCallback((
        event: HitboxTestableEvent
    ): void => {

        if (isDraggingRef.current) {
            logger.warn(
                "beginDrag: already dragging"
            );
            return;
        }

        const scrollContainer = scrollContainerRef.current;
        const scrollbarThumb = scrollbarThumbRef.current;
        const scrollbarTrack = scrollbarTrackRef.current;

        if (
            !scrollContainer ||
            !scrollbarThumb ||
            !scrollbarTrack
        ) {
            logger.warn(
                "beginDrag: Missing required refs"
            );
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        isDraggingRef.current = true;

        scrollbarThumb.style.backgroundColor = hoverColorCSSVar;

        const scrollbarTrackRect = scrollbarTrack.getBoundingClientRect();
        const scrollbarThumbRect = scrollbarThumb.getBoundingClientRect();

        if (
            // check if the pointer is within the thumb bounds by only comparing
            // the Y coordinate since the X coordinate may be outside the
            // thumb due to the expanded hitbox
            event.clientY >= scrollbarThumbRect.top &&
            event.clientY <= scrollbarThumbRect.bottom
        ) {

            // clicked on the thumb: begin dragging from current position
            dragStartYRef.current = event.clientY;
            dragStartScrollTopRef.current = scrollContainer.scrollTop;
            dragStartThumbTopOffsetRef.current = thumbTopOffsetRef.current;
        }
        else {
            // clicked on the track outside the thumb: move the thumb to that
            // position immediately.
            const trackHeight = trackHeightRef.current;
            const thumbHeight = thumbHeightRef.current;
            const maxThumbTravel = trackHeight - thumbHeight;

            /**
             * The distance between the top of the track and the click position.
             */
            const trackClickOffsetY = event.clientY - scrollbarTrackRect.top;

            // move thumb center to click position
            const theoreticalNextThumbTop = trackClickOffsetY -
                (thumbHeight / 2);

            // clamp to track bounds
            const nextThumbTop = clamp(theoreticalNextThumbTop, {
                min: 0,
                max: maxThumbTravel
            });

            dragStartThumbTopOffsetRef.current = nextThumbTop;

            const scrollHeight = scrollContainer.scrollHeight;
            const clientHeight = scrollContainer.clientHeight;

            /** The total distance the container can scroll. */
            const maxScrollTop = scrollHeight - clientHeight;

            const nextScrollTop =
                (nextThumbTop / maxThumbTravel) * maxScrollTop;

            scrollContainer.scrollTop = nextScrollTop;

            dragStartScrollTopRef.current = nextScrollTop;
            dragStartYRef.current = event.clientY;

            logger.debug(
                "beginDrag: " +
                `trackClickOffsetY: ${trackClickOffsetY}; ` +
                `theoreticalNextThumbTop: ${theoreticalNextThumbTop}; ` +
                `nextThumbTop: ${nextThumbTop}; ` +
                `nextScrollTop: ${nextScrollTop}; ` +
                `event.clientY: ${event.clientY}; ` +
                `dragStartY: ${dragStartYRef.current}; ` +
                `dragStartScrollTop: ${dragStartScrollTopRef.current}`
            );

        }

        window.addEventListener("pointermove", onDrag);

        window.addEventListener("pointerup", endDrag);
        window.addEventListener("pointercancel", endDrag);


    }, [endDrag, onDrag, scrollContainerRef]);

    /**
     * Handles pointer down and touch start event that occur on the scrollbar
     * track, and determines whether to begin scroll bar thumb reposition/drag
     * operations.
     */
    const handleHitboxTestableEvent = useCallback((
        event: HitboxTestableEvent
    ): void => {

        if (isDraggingRef.current) {
            // already dragging: ignore
            logger.debug(
                "handleHitboxTestableEvent: already dragging: ignoring event:",
                event
            );
            return;
        }

        logger.debug(
            "handleHitboxTestableEvent: " +
            `event.clientX: ${event.clientX}; ` +
            `event.clientY: ${event.clientY}; ` +
            `event.pointerType: ${event.pointerType}`
        );

        beginDrag(
            event
        );

    }, [
        beginDrag
    ]);

    // MARK: - Pointer Events -

    /**
     * Suppresses click events that occur after dragging the scrollbar thumb
     * ends to prevent other click handlers from being triggered and potentially
     * closing the dropdown menu or otherwise interfering with the drag
     * operation.
     */
    const onClickWindow = useCallback((
        event: MouseEvent
    ): void => {

        if (didEndDragWithPointerDownRef.current) {
            logger.debug(
                "onClickWindow: suppressing click event that occurred after " +
                "drag operation"
            );
            didEndDragWithPointerDownRef.current = false;
            event.stopImmediatePropagation();
            event.stopPropagation();
            event.preventDefault();
        }

    }, []);

    /**
     * Handles clicks on the scrollbar track to prevent them from propagating
     * and potentially triggering other click handlers (e.g., handlers that
     * could close the dropdown menu).
     */
    const handleTrackClick = useCallback((
        event: ReactMouseEvent<HTMLDivElement>
    ): void => {
        event.nativeEvent.stopImmediatePropagation();
        event.stopPropagation();
        event.preventDefault();
    }, []);

    /**
     * When not dragging, sets the hover style if the pointer is within the
     * scrollbar thumb. When not using the expanded scrollbar hitbox, this
     * method is not used; we rely on CSS :hover styles instead.
     */
    const handleScrollbarPointerMove = useCallback((
        event: PointerEvent
    ): void => {

        if (isDraggingRef.current) {
            // while dragging, do not modify hover styles
            return;
        }

        const scrollbarThumb = scrollbarThumbRef.current;
        if (!scrollbarThumb) {
            logger.warn(
                "handleScrollbarPointerMove: Missing scrollbar thumb ref"
            );
            return;
        }

        const scrollbarThumbRect =
            scrollbarThumb.getBoundingClientRect();

        if (eventWithinDomRect(event, scrollbarThumbRect)) {
            // pointer within thumb bounds: set hover style
            scrollbarThumb.style.backgroundColor = hoverColorCSSVar;
        }
        else {
            // pointer outside thumb bounds: clear hover style
            scrollbarThumb.style.backgroundColor = "";
        }

    }, []);

    /**
     * Handles pointer down events on the scrollbar hitbox to begin drag
     * operations.
     */
    const handleScrollbarHitboxPointerDown = useCallback((
        event: PointerEvent
    ): void => {

        // return;

        logger.debug(
            "handleScrollbarHitboxPointerDown: pointer event:",
            event
        );

        if (event.pointerType === "touch") {
            // let touch events be handled by the touch event handlers
            return;
        }

        const hitboxEvent = HitboxTestableEvent.fromPointerEvent(
            event
        );

        handleHitboxTestableEvent(hitboxEvent);


    }, [handleHitboxTestableEvent]);

    // MARK: - Touch Events -

    /**
     * Handles touch start events on the scrollbar hitbox to prevent touch
     * scrolling or other browser-default behavior.
     */
    const handleScrollbarHitboxTouchStart = useCallback((
        event: TouchEvent
    ): void => {

        const touchesLength = event.touches.length;

        logger.debug(
            `handleWindowTouchStart: touchesLength: ${touchesLength}; ` +
            "touch event:", event
        );

        if (touchesLength !== 1) {
            // more than one touch indicates some other multi-finger gesture
            // (e.g, pinch to zoom) that never indicates an intention to
            // interact with the scrollbar, so we don't interfere with it
            logger.debug(
                "handleWindowTouchStart: touches length != 1 " +
                `(${touchesLength}); ignoring event`
            );
            return;
        }
        else {
            logger.debug(
                "handleWindowTouchStart: single touch: handling event"
            );
        }

        const touch = event.touches[0]!;

        const hitboxEvent = HitboxTestableEvent.fromTouchEvent(
            event,
            touch
        );

        handleHitboxTestableEvent(hitboxEvent);

    }, [
        handleHitboxTestableEvent
    ]);

    /**
     * Handles touch move events anywhere on the window to prevent touch
     * scrolling or other browser-default behavior while dragging the scrollbar
     * thumb.
     */
    const handleWindowTouchMove = useCallback((
        event: TouchEvent
    ): void => {

        if (isDraggingRef.current) {
            logger.debug(
                "handleWindowTouchMove: " +
                "dragging: preventing default"
            );
            event.preventDefault();
        }

    }, []);

    // MARK: - Wheel Events -

    const handleScrollbarHitboxWheel = useCallback((
        event: WheelEvent
    ): void => {

        if (event.ctrlKey) {
            // then this is a pinch-to-zoom gesture, so we ignore it and allow
            // the default behavior
            return;
        }

        const scrollContainerWrapper = scrollContainerWrapperRef.current;
        if (!scrollContainerWrapper) {
            logger.warn(
                "handleWheel: Missing scrollContainerWrapper ref"
            );
            return;
        }

        if (
            // if the expanded scrollbar hitbox is not enabled, then this event
            // handler was attached directly to the scroll track, so we already
            // know the event occurred within the scroll container wrapper
            !expandedScrollbarHitboxEnabled ||
            // the scrollbar expanded hitbox is rendered above the scroll
            // container wrapper, so we must test if the wheel event occurred
            // within the wrapper's bounds, and then perform the scroll manually
            // if it did
            eventWithinDomRect(
                event,
                // avoid calling getBoundingClientRect unless actually needed
                scrollContainerWrapper.getBoundingClientRect()
            )
        ) {
            logger.debug(
                "handleWheel: wheel event within scroll container wrapper"
            );

            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();

            // perform scroll
            const scrollContainer = scrollContainerRef.current;
            if (!scrollContainer) {
                logger.warn(
                    "handleWheel: Missing scroll container ref"
                );
                return;
            }

            scrollContainer.scrollTop += event.deltaY;
        }
        else {
            logger.debug(
                "handleWheel: wheel event outside scroll container wrapper"
            );
        }
    }, [
        scrollContainerWrapperRef,
        scrollContainerRef,
        expandedScrollbarHitboxEnabled
    ]);

    // MARK: useImperativeHandle: Expose scheduleGeometryUpdate method
    useImperativeHandle(handle, (): CustomScrollbarHandle => ({
        scheduleGeometryUpdate,
        repositionScrollbarHitbox
    }), [
        scheduleGeometryUpdate,
        repositionScrollbarHitbox
    ]);

    // MARK: useLayoutEffect: Setup scroll listener
    useLayoutEffect(() => {

        // useLayoutEffect is necessary to ensure geometry is updated before
        // paint because the scrollbar appears/disappears based on whether the
        // content overflows the container

        const scrollContainer = scrollContainerRef.current;
        if (!scrollContainer) {
            logger.warn(
                "useEffect: Missing scroll container ref"
            );
            return;
        }

        function onScroll(): void {
            scheduleGeometryUpdate({
                batchToAnimationFrame: true,
                // merely scrolling does not change the position of the
                // scrollbar hitbox
                repositionScrollbarHitbox: false
            });
        }

        if (
            debugConfig.showScrollScrollbarHitboxes
        ) {
            // the element itself is still only conditionally rendered based on
            // `isVisible`, but if debug hitboxes are enabled, show the hitbox
            // whenever the scroll bar is visible
            scrollbarHitbox?.classList.add(
                styles.debugScrollbarHitboxShow
            );
        }
        else {
            scrollbarHitbox?.classList.remove(
                styles.debugScrollbarHitboxShow
            );
        }

        if (isVisible) {
            scheduleGeometryUpdate({ batchToAnimationFrame: false });
            scrollContainer.addEventListener("scroll", onScroll);
        }

        return (): void => {
            scrollContainer.removeEventListener("scroll", onScroll);
        };

    }, [
        scrollContainerRef,
        scheduleGeometryUpdate,
        isVisible,
        scrollbarHitbox,
        debugConfig.showScrollScrollbarHitboxes
    ]);

    // MARK: useEffect: Setup window pointer, click, touch event handlers when
    //  scroll bar is showing
    useEffect(() => {

        logger.debug(
            `CustomScrollbar useEffect: isVisible: ${isVisible}; ` +
            `expandedScrollbarHitboxEnabled: ${expandedScrollbarHitboxEnabled}`
        );

        const scrollbarTrack = scrollbarTrackRef.current;
        const scrollbarThumb = scrollbarThumbRef.current;

        if (isVisible) {
            window.addEventListener(
                "click", onClickWindow,
                { capture: true }
            );
            window.addEventListener(
                "touchmove", handleWindowTouchMove,
                { capture: true, passive: false }
            );

            if (expandedScrollbarHitboxEnabled) {
                scrollbarHitbox?.addEventListener(
                    "pointermove", handleScrollbarPointerMove
                );
                scrollbarHitbox?.addEventListener(
                    "pointerdown", handleScrollbarHitboxPointerDown
                );
                scrollbarHitbox?.addEventListener(
                    "touchstart", handleScrollbarHitboxTouchStart,
                    { passive: false }
                );
                scrollbarHitbox?.addEventListener(
                    "wheel", handleScrollbarHitboxWheel,
                    { passive: false }
                );
            }
            else {
                scrollbarTrack?.addEventListener(
                    "pointerdown", handleScrollbarHitboxPointerDown
                );
                scrollbarTrack?.addEventListener(
                    "touchstart", handleScrollbarHitboxTouchStart,
                    { passive: false }
                );
                scrollbarTrack?.addEventListener(
                    "wheel", handleScrollbarHitboxWheel,
                    { passive: false }
                );
            }

        }
        else {
            // not visible: ensure any ongoing drag is ended
            endDrag();
            didEndDragWithPointerDownRef.current = false;
            if (scrollbarThumb) {
                // remove any hover style
                scrollbarThumb.style.backgroundColor = "";
            }
        }

        return (): void => {

            window.removeEventListener(
                "click", onClickWindow,
                { capture: true }
            );
            window.removeEventListener(
                "touchmove", handleWindowTouchMove,
                { capture: true }
            );

            if (expandedScrollbarHitboxEnabled) {
                scrollbarHitbox?.removeEventListener(
                    "pointermove", handleScrollbarPointerMove
                );
                scrollbarHitbox?.removeEventListener(
                    "pointerdown", handleScrollbarHitboxPointerDown,
                );
                scrollbarHitbox?.removeEventListener(
                    "touchstart", handleScrollbarHitboxTouchStart,
                );
                scrollbarHitbox?.removeEventListener(
                    "wheel", handleScrollbarHitboxWheel
                );
            }
            else {
                scrollbarTrack?.removeEventListener(
                    "pointerdown", handleScrollbarHitboxPointerDown,
                );
                scrollbarTrack?.removeEventListener(
                    "touchstart", handleScrollbarHitboxTouchStart,
                );
                scrollbarTrack?.removeEventListener(
                    "wheel", handleScrollbarHitboxWheel
                );
            }

        };

    }, [
        isVisible,
        onClickWindow,
        handleScrollbarPointerMove,
        handleScrollbarHitboxPointerDown,
        handleScrollbarHitboxTouchStart,
        handleScrollbarHitboxWheel,
        handleWindowTouchMove,
        endDrag,
        scrollbarHitbox,
        expandedScrollbarHitboxEnabled
    ]);

    return (
        <>
            <div
                className={styles.scrollbarTrack}
                ref={scrollbarTrackRef}
                onClick={handleTrackClick}
            >
                <div
                    className={styles.scrollbarThumb}
                    ref={scrollbarThumbRef}
                >
                    {debugConfig.showScrollScrollbarHitboxes && (
                        // debug show middle of thumb
                        <div style={{
                            backgroundColor: "red",
                            height: "5px",
                            width: "100%",
                            margin: "auto"
                        }} />
                    )}
                </div>
            </div>
            {isVisible && expandedScrollbarHitboxEnabled && createPortal((
                <div
                    data-scrollbar-hitbox // marker attribute
                    className={styles.scrollbarHitbox}
                    ref={setScrollbarHitbox}
                    style={{
                        zIndex: zIndex + 1
                    }}
                />
            ), document.body)}
        </>
    );

}

// use any to exclude from the generated .d.ts file
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
(CustomScrollbar as any).displayName = "CustomScrollbar";
