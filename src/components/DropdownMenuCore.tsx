import {
    type JSX,
    type RefObject,
    type PropsWithChildren,
    useCallback,
    useRef,
    useState,
    useImperativeHandle,
    useEffect,
    memo
} from "react";

import { DropdownMenuScrollArrow } from "./DropdownMenuScrollArrow";

import { dropdownMenuCoreLogger as logger } from "../utils/loggers";

import { VelocityKickDetector } from "../model/VelocityKickDetector";

import {
    type VerticalEdge,
    flushSyncIf
} from "../utils/MiscellaneousUtilities";

export type DropdownMenuBeginContinuousScrolling = (
    edge: VerticalEdge,
    speed: "slow" | "fast"
) => void;

export type UpdateScrollPropertiesOptions = {
    flush?: boolean;
};

export type UpdateScrollProperties = (
    options?: UpdateScrollPropertiesOptions
) => void;

export type DropdownMenuCoreProps = PropsWithChildren<{
    /** Whether this dropdown menu/submenu is open. */
    isOpen: boolean;
    handle: RefObject<DropdownMenuCoreHandle | null>;
    dropdownMenuRef: RefObject<HTMLDivElement | null>;
    dropdownMenuContentRef: RefObject<HTMLDivElement | null>;
}>;

export type DropdownMenuCoreHandle = {
    endContinuousScrolling: () => void;
    updateScrollProperties: UpdateScrollProperties;
};

/**
 * Contains the core logic shared by both the main dropdown menu and the
 * submenus
 */
export const DropdownMenuCore = memo(function DropdownMenuCore(
    props: DropdownMenuCoreProps
): JSX.Element {

    const {
        isOpen,
        handle,
        dropdownMenuRef,
        dropdownMenuContentRef,
        children
    } = props;

    // const dropdownMenuContext = useContext(DropdownMenuContext);

    const scrollArrowUpRef = useRef<HTMLDivElement>(null);
    const scrollArrowDownRef = useRef<HTMLDivElement>(null);

    const continuousScrollingIntervalID = useRef<number | undefined>(undefined);
    const isContinuouslyScrollingRef = useRef<boolean>(false);

    /**
     * Whether or not momentum wheel events are being blocked.
     *
     * Used to continue to block momentum scroll events even after the pointer
     * has left the scroll arrow/the scroll arrow disappeared.
     */
    const isBlockingMomentumWheelEventsRef = useRef<boolean>(false);

    /**
     * Timeout ID for momentum scrolling end detection.
     */
    const momentumScrollTimeoutIdRef = useRef<number | undefined>(undefined);

    const velocityKickDetectorRef = useRef(new VelocityKickDetector());

    // Whether or not the dropdown menu is scrolled to the top or bottom. Both
    // are true when the dropdown menu is not scrollable.
    const [isScrolledToTop, setIsScrolledToTop] = useState(true);
    const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);

    const pointerIsOverScrollArrowUpRef = useRef<boolean>(false);

    const pointerIsOverScrollArrowDownRef = useRef<boolean>(false);

    /**
     * Updates whether the dropdown menu is scrolled to the top or bottom, which
     * affects the visibility of the scroll arrows.
     *
     * @param options - Options for updating the scroll properties.
     */
    const updateScrollProperties = useCallback<UpdateScrollProperties>((
        { flush = true } = {}
    ): void => {

        const dropdownMenu = dropdownMenuRef.current;
        if (!dropdownMenu) {
            logger.warn(
                "updateScrollProperties: dropdownMenu is null"
            );
            return;
        }

        logger.debug(
            "updateScrollProperties:" +
            // these are commented out to reduce unnecessary dependencies
            // `\nisScrolledToTop: ${isScrolledToTop}` +
            // `\nisScrolledToBottom: ${isScrolledToBottom}` +
            `\ndropdownMenu.scrollTop: ${dropdownMenu.scrollTop}` +
            `\ndropdownMenu.clientHeight: ${dropdownMenu.clientHeight}` +
            `\ndropdownMenu.scrollHeight: ${dropdownMenu.scrollHeight}`
        );

        // Theses updates to setIsScrolledToTop/Bottom must be flushed
        // synchronously. When `positionDropdownMenu`, which synchronously calls
        // this method, is called (e.g. in response to a visual viewport
        // resize), it imperatively mutates DOM layout to set the dropdown
        // menu's position, which may affect the below calculation of whether
        // the menu content is scrolled to the top/bottom. If we allow the state
        // update to be deferred, the browser may paint after the end of this
        // task based on the imperative DOM mutations but before React commits
        // this state change, causing a visible intermediate layout (e.g. scroll
        // arrows briefly out of sync). `flushSync` forces React to commit this
        // update and run any dependent layout effects before the next paint,
        // keeping the visual update atomic.
        flushSyncIf(flush, () => {
            if (dropdownMenu.scrollTop <= 2) {
                // the top of the dropdown menu content is at the top of the
                // dropdown menu
                setIsScrolledToTop(true);
                logger.debug(
                    "updateScrollProperties: setIsScrolledToTop(true)"
                );
            }
            else {
                // dropdown menu content is scrolled down
                logger.debug(
                    "updateScrollProperties: setIsScrolledToTop(false)"
                );
                setIsScrolledToTop(false);
            }

            if (
                dropdownMenu.scrollTop + dropdownMenu.clientHeight >=
                dropdownMenu.scrollHeight - 2
            ) {
                // the bottom of the dropdown menu content is at the bottom of
                // the dropdown menu
                setIsScrolledToBottom(true);
                logger.debug(
                    "updateScrollProperties: setIsScrolledToBottom(true)"
                );
            }
            else {
                // dropdown menu content is scrolled up
                setIsScrolledToBottom(false);
                logger.debug(
                    "updateScrollProperties: setIsScrolledToBottom(false)"
                );
            }
        });

    }, [
        // re-enable for logging
        // isScrolledToBottom,
        // isScrolledToTop,
        dropdownMenuRef
    ]);

    const endContinuousScrolling = useCallback((
        updateIsContinuouslyScrollingRef = true
    ): void => {
        logger.info(
            "endContinuousScrolling: " +
            "updateIsContinuouslyScrollingRef: " +
            `${updateIsContinuouslyScrollingRef}`
        );

        clearInterval(continuousScrollingIntervalID.current);
        continuousScrollingIntervalID.current = undefined;
        if (updateIsContinuouslyScrollingRef) {
            isContinuouslyScrollingRef.current = false;
        }
    }, []);

    const beginContinuousScrolling = useCallback<DropdownMenuBeginContinuousScrolling>((
        edge,
        speed
    ): void => {

        logger.info(
            `beginContinuousScrolling: direction: ${edge}; ` +
            `speed: ${speed}`
        );

        // do not set isContinuouslyScrollingRef to false because we are about
        // to set it to true again
        endContinuousScrolling(false);

        isContinuouslyScrollingRef.current = true;

        const scrollStep = speed === "fast" ? 30 : 15; // pixels
        const scrollInterval = 30; // milliseconds

        function scroll(): void {

            const dropdownMenu = dropdownMenuRef.current;
            if (!dropdownMenu) {
                logger.warn(
                    "beginContinuousScrolling: dropdownMenu is null"
                );
                return;
            }

            if (edge === "top") {
                // logger.debug(
                //     `continuous scroll: up ${scrollStep}px`
                // );
                dropdownMenu.scrollTop -= scrollStep;
            }
            else {
                // logger.debug(
                //     `continuous scroll: down ${scrollStep}px`
                // );
                dropdownMenu.scrollTop += scrollStep;
            }

            if (
                dropdownMenu.scrollTop <= 0 ||
                dropdownMenu.scrollTop + dropdownMenu.clientHeight >=
                dropdownMenu.scrollHeight
            ) {
                logger.debug(
                    "beginContinuousScrolling: reached end of dropdown menu; " +
                    "stopping continuous scrolling"
                );
                endContinuousScrolling();
            }

        }

        continuousScrollingIntervalID.current = setInterval(
            scroll, scrollInterval
        );

    }, [endContinuousScrolling, dropdownMenuRef]);

    const handleWheel = useCallback((
        event: WheelEvent
    ): void => {

        logger.debug(
            "handleWheel: " +
            `pointerIsOverScrollArrowUp: ${pointerIsOverScrollArrowUpRef.current}; ` +
            `pointerIsOverScrollArrowDown: ${pointerIsOverScrollArrowDownRef.current}; ` +
            `isContinuouslyScrolling: ${isContinuouslyScrollingRef.current}`
        );

        const velocityKickDetector = velocityKickDetectorRef.current;

        const dropdownMenu = dropdownMenuRef.current;
        if (!dropdownMenu) {
            logger.warn(
                "handleWheel: dropdownMenu is null"
            );
            return;
        }

        if (event.ctrlKey) {
            // then this is a pinch-to-zoom gesture, so we ignore it and allow
            // the default behavior
            return;
        }

        const velocityKickResult = velocityKickDetector.updateWithEvent(
            event
        );

        if (
            (
                pointerIsOverScrollArrowUpRef.current ||
                pointerIsOverScrollArrowDownRef.current
            ) &&
            isContinuouslyScrollingRef.current
        ) {
            // block wheel events while the menu is continuously scrolling and
            // the pointer is over a scroll arrow
            logger.debug(
                "handleWheel: blocking wheel event; pointer is over scroll " +
                "arrow and menu is continuously scrolling"
            );
            event.preventDefault();
            event.stopPropagation();
            // Block further wheel events—even if the pointer is no longer over
            // the scroll arrow or the scroll arrow disappears—until momentum
            // scrolling ends. This is necessary because scroll gestures that
            // were actually performed while the pointer was over the scroll
            // arrow may continue to generate wheel events (i.e., momentum
            // scrolling) after the pointer has left the scroll arrow or the
            // scroll arrow has disappeared. These wheel events are generated
            // from a physical scroll gesture that was performed while the
            // pointer was over the scroll arrow, so they should also be
            // blocked.
            isBlockingMomentumWheelEventsRef.current = true;

        }
        else if (isBlockingMomentumWheelEventsRef.current) {
            // MARK: check is this wheel event is part of momentum scrolling and
            //  only block it if it is

            if (velocityKickResult.isKickStart) {
                // NOT momentum scrolling: allow wheel events
                logger.debug(
                    "handleWheel: momentum detection: allowing wheel event; " +
                    "NOT presumed momentum scrolling"
                );
                isBlockingMomentumWheelEventsRef.current = false;
                clearTimeout(momentumScrollTimeoutIdRef.current);
                momentumScrollTimeoutIdRef.current = undefined;
                velocityKickDetector.reset();
            }
            else {
                // IS momentum scrolling: block wheel events
                logger.debug(
                    "handleWheel: momentum detection: blocking wheel event; " +
                    "IS presumed momentum scrolling"
                );
                event.preventDefault();
                event.stopPropagation();

                // reset timeout - momentum scrolling is still happening
                clearTimeout(momentumScrollTimeoutIdRef.current);
                momentumScrollTimeoutIdRef.current = setTimeout(() => {
                    logger.debug(
                        "handleWheel: momentum detection: no wheel events " +
                        "for delay; stop blocking momentum scrolling and " +
                        "allowing ALL wheel events again"
                    );
                    isBlockingMomentumWheelEventsRef.current = false;
                    velocityKickDetector.reset();
                }, 200);
            }

        }
        else {
            // allow wheel events when the pointer is not over a scroll arrow
            // or the menu is not continuously scrolling
            logger.debug(
                "handleWheel: allowing wheel event; pointer is not over " +
                "scroll arrow or menu is not continuously scrolling"
            );
        }

    }, [
        dropdownMenuRef
    ]);

    useImperativeHandle(handle, (): DropdownMenuCoreHandle => ({
        endContinuousScrolling,
        updateScrollProperties
    }), [
        endContinuousScrolling,
        updateScrollProperties
    ]);


    // MARK: update scroll properties when the dropdown menu is scrolled
    useEffect(() => {

        function onScroll(): void {
            logger.debug(
                "DropdownMenuCore: useEffect: scroll event"
            );
            updateScrollProperties();
        }

        const dropdownMenu = dropdownMenuRef.current;

        if (isOpen) {
            // we do NOT need to call updateScrollProperties() here because the
            // code that opens the menu will call it directly after opening the
            // menu and positioning it

            if (dropdownMenu) {
                dropdownMenu.addEventListener("scroll", onScroll);
            }
            else {
                logger.warn(
                    "DropdownMenuCore: useEffect: dropdownMenu or " +
                    "dropdownMenuContent is null"
                );
            }
        }

        return (): void => {
            dropdownMenu?.removeEventListener(
                "scroll", onScroll
            );
        };

    }, [
        isOpen,
        dropdownMenuRef,
        updateScrollProperties
    ]);

    // MARK: handle wheel events for scrolling
    useEffect(() => {

        const dropdownMenu = dropdownMenuRef.current;

        if (isOpen) {

            if (dropdownMenu) {
                dropdownMenu.addEventListener(
                    "wheel",
                    handleWheel,
                    { passive: false }
                );
            }
            else {
                logger.warn(
                    "DropdownMenuCore: useEffect: dropdownMenu is null"
                );
            }

        }
        else {
            // stop any continuous scrolling when the menu is closed
            endContinuousScrolling();
            isBlockingMomentumWheelEventsRef.current = false;
            clearTimeout(momentumScrollTimeoutIdRef.current);
            momentumScrollTimeoutIdRef.current = undefined;
            velocityKickDetectorRef.current.reset();
        }

        return (): void => {
            dropdownMenu?.removeEventListener(
                "wheel", handleWheel
            );
        };

    }, [
        isOpen,
        dropdownMenuRef,
        endContinuousScrolling,
        handleWheel
    ]);

    return (
        <>
            <DropdownMenuScrollArrow
                isOpen={isOpen}
                ref={scrollArrowUpRef}
                edge="top"
                isScrolledToEdge={isScrolledToTop}
                // isScrolledToEdge={true}
                isContinuouslyScrollingRef={isContinuouslyScrollingRef}
                beginContinuousScrolling={beginContinuousScrolling}
                endContinuousScrolling={endContinuousScrolling}
                pointerIsOverRef={pointerIsOverScrollArrowUpRef}
            />
            <div
                className="bd-dropdown-menu-content"
                ref={dropdownMenuContentRef}
            >
                {children}
            </div>
            <DropdownMenuScrollArrow
                isOpen={isOpen}
                ref={scrollArrowDownRef}
                edge="bottom"
                isScrolledToEdge={isScrolledToBottom}
                // isScrolledToEdge={true}
                isContinuouslyScrollingRef={isContinuouslyScrollingRef}
                beginContinuousScrolling={beginContinuousScrolling}
                endContinuousScrolling={endContinuousScrolling}
                pointerIsOverRef={pointerIsOverScrollArrowDownRef}
            />
        </>
    );
});

DropdownMenuCore.displayName = "DropdownMenuCore";
