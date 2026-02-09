import {
    type JSX,
    type RefObject,
    useCallback,
    useMemo,
    useRef,
    useContext,
    useLayoutEffect,
    useEffect
} from "react";

import { DropdownMenuContext } from "../model/DropdownMenuContext";
import type { DropdownMenuBeginContinuousScrolling } from "./DropdownMenuCore";

import {
    type VerticalEdge
} from "../utils/MiscellaneousUtilities";

import { dropdownMenuScrollArrowLogger as logger } from "../utils/loggers";

export type DropdownMenuScrollArrowProps = {
    isOpen: boolean;
    ref: RefObject<HTMLDivElement | null>;
    edge: VerticalEdge;
    isScrolledToEdge: boolean;
    isContinuouslyScrollingRef: RefObject<boolean>;
    beginContinuousScrolling: DropdownMenuBeginContinuousScrolling;
    endContinuousScrolling: () => void;
    pointerIsOverRef: RefObject<boolean>;
};

export function DropdownMenuScrollArrow(
    {
        isOpen,
        ref,
        edge,
        isScrolledToEdge,
        isContinuouslyScrollingRef,
        beginContinuousScrolling,
        endContinuousScrolling,
        pointerIsOverRef,
    }: DropdownMenuScrollArrowProps
): JSX.Element {

    logger.debug("render; edge:", edge);

    const {
        ignoreClicksUntilNextPointerDownRef,
        mouseHoverEvents
    } = useContext(DropdownMenuContext);

    const scrollArrowContainerRef = useRef<HTMLDivElement | null>(null);

    // the date when the component appeared
    const appearedDateRef = useRef<Date | null>(null);

    // Whether or not the pointer has left the scroll arrow at least once since
    // the component appeared. This is used to determine if we should start
    // scrolling immediately when the pointer enters the scroll arrow again
    // after it has left, even if the component has just appeared.
    const pointerHasLeftAtLeastOnceSinceAppearRef = useRef<boolean>(false);

    const arrowIconName = useMemo((): string => {
        return edge === "bottom"
            ? "fa-solid fa-caret-down"
            : "fa-solid fa-caret-up";
    }, [edge]);

    /**
     * Whether or not the component appeared less than 250ms ago.
     */
    const recentlyAppeared = useCallback((): boolean => {
        if (appearedDateRef.current === null) {
            // then the useEffect has not even run yet, so we know that the
            // component just appeared
            logger.debug("recentlyAppeared: appearedDateRef is null");
            return true;
        }
        const timeSinceAppear = new Date().getTime()
            - appearedDateRef.current.getTime();
        logger.debug(
            `recentlyAppeared: timeSinceAppear: ${timeSinceAppear}ms`
        );

        return timeSinceAppear < 250;
    }, []);

    /**
     * Determines if we should ignore the initial pointer enter and move events
     * on the scroll arrow. (This does not apply to pointer down, up, leave, and
     * cancel events.) This is used to prevent the initial pointer events from
     * starting the continuous scrolling when the component has just appeared.
     */
    const shouldIgnorePointerEvents = useCallback((): boolean => {
        if (pointerHasLeftAtLeastOnceSinceAppearRef.current) {
            // if the pointer has left the scroll arrow at least once since the
            // component appeared, then we don't ignore the initial pointer
            // events
            logger.debug(
                "shouldIgnoreInitialPointerEvents: " +
                "pointerHasLeftAtLeastOnceSinceAppearRef is true"
            );
            return false;
        }
        if (recentlyAppeared()) {
            // if the component just appeared, then we ignore the initial
            // pointer events
            logger.debug(
                "shouldIgnoreInitialPointerEvents: recentlyAppeared is true"
            );
            return true;
        }
        else {
            return false;
        }
    }, [recentlyAppeared]);


    const handleScrollArrowClick = useCallback((
        event: React.MouseEvent<HTMLDivElement, MouseEvent>
    ): void => {
        logger.debug(`handleScrollArrowClick: edge: ${edge}`);
        event.stopPropagation();
        event.preventDefault();
    }, [edge]);

    const handleScrollArrowPointerDown = useCallback((
        event: React.PointerEvent<HTMLElement>
    ): void => {
        logger.debug(
            `handleScrollArrowPointerDown: edge: ${edge}; ` +
            "event:", event
        );
        event.preventDefault();
        // if the pointer is down when the scroll arrow disappears, we need to
        // inform the context so that it can ignore the subsequent click event
        // that will be fired on the element below the scroll arrow when the
        // pointer is released
        ignoreClicksUntilNextPointerDownRef.current = true;

        const speed = event.pointerType === "touch" ? "slow" : "fast";
        beginContinuousScrolling(edge, speed);
    }, [
        beginContinuousScrolling,
        edge,
        ignoreClicksUntilNextPointerDownRef
    ]);

    const handleScrollArrowPointerUp = useCallback((
        event: React.PointerEvent<HTMLElement>
    ): void => {
        logger.debug(
            `handleScrollArrowPointerUp: edge: ${edge}; ` +
            `pointerIsOver: ${pointerIsOverRef.current}`
        );
        event.preventDefault();
        ignoreClicksUntilNextPointerDownRef.current = false;
        if (pointerIsOverRef.current) {
            // if the menu is already scrolling, the previous timeout set by
            // beginContinuousScrolling will be cleared
            beginContinuousScrolling(edge, "slow");
        }
        else {
            endContinuousScrolling();
        }
    }, [
        beginContinuousScrolling,
        edge,
        endContinuousScrolling,
        pointerIsOverRef,
        ignoreClicksUntilNextPointerDownRef
    ]);

    const handleScrollArrowPointerEnter = useCallback((
        event: React.PointerEvent<HTMLElement>
    ): void => {

        if (!mouseHoverEvents) {
            return;
        }

        logger.debug(
            `handleScrollArrowPointerEnter: edge: ${edge}; ` +
            "event:", event
        );

        if (event.pointerType === "touch") {
            // If the pointer type is touch, we don't want to start scrolling
            // immediately, as it may interfere with touch interactions.
            // Instead, we wait for the pointerDown event which should fire at
            // the same time.
            logger.debug(
                "handleScrollArrowPointerEnter: ignoring because pointer " +
                "type is touch"
            );
            return;
        }

        pointerIsOverRef.current = true;

        if (shouldIgnorePointerEvents()) {
            logger.debug(
                "handleScrollArrowPointerEnter: ignoring because " +
                "shouldIgnorePointerEvents is true"
            );
            return;
        }

        beginContinuousScrolling(edge, "slow");
        logger.debug(
            `handleScrollArrowPointerEnter: edge: ${edge}; ` +
            "beginContinuousScrolling"
        );

    }, [
        beginContinuousScrolling,
        edge,
        shouldIgnorePointerEvents,
        pointerIsOverRef,
        mouseHoverEvents
    ]);

    const handleScrollArrowPointerLeave = useCallback((
        event: React.PointerEvent<HTMLElement>
    ): void => {

        if (!mouseHoverEvents) {
            return;
        }

        logger.debug(
            `handleScrollArrowPointerLeave: edge: ${edge}; ` +
            "event:", event
        );

        // if the pointer leaves the scroll arrow, then when it enters again,
        // we want to start scrolling immediately
        pointerHasLeftAtLeastOnceSinceAppearRef.current = true;
        pointerIsOverRef.current = false;
        logger.debug(
            `handleScrollArrowPointerLeave: edge: ${edge}; ` +
            "setPointerIsOver(false)"
        );
        endContinuousScrolling();
    }, [
        edge,
        endContinuousScrolling,
        pointerIsOverRef,
        mouseHoverEvents
    ]);

    const handlePointerMove = useCallback((
        event: React.PointerEvent<HTMLElement>
    ): void => {

        if (!mouseHoverEvents) {
            return;
        }

        logger.debug(
            `handlePointerMove: edge: ${edge}; ` +
            // `pointerIsOver: ${pointerIsOver}; ` +
            `isContinuouslyScrolling: ${isContinuouslyScrollingRef.current}; ` +
            "event:", event
        );

        if (
            !isContinuouslyScrollingRef.current &&
            !shouldIgnorePointerEvents()
        ) {
            logger.debug(
                "handlePointerMove: starting continuous scrolling"
            );
            beginContinuousScrolling(edge, "slow");
        }
        else {
            logger.debug(
                "handlePointerMove: not starting continuous scrolling " +
                "because isContinuouslyScrolling is true or component " +
                "recently appeared"
            );
        }


    }, [
        beginContinuousScrolling,
        edge,
        // pointerIsOver,
        shouldIgnorePointerEvents,
        isContinuouslyScrollingRef,
        mouseHoverEvents
    ]);

    useEffect(() => {
        if (!isOpen) {
            // reset state when the dropdown menu is closed
            appearedDateRef.current = null;
            pointerHasLeftAtLeastOnceSinceAppearRef.current = false;
            logger.debug(
                `useEffect: ${edge}: isOpen false: resetting`
            );
        }
    }, [
        edge,
        isOpen
    ]);

    // MARK: update appearance of scroll arrow based on isScrolledToEdge
    useLayoutEffect(() => {

        // useLayoutEffect is necessary because this appearance change should
        // happen before the browser paints

        const scrollArrowContainer = scrollArrowContainerRef.current;
        if (scrollArrowContainer) {
            if (isScrolledToEdge) {
                // the scroll arrow should disappear

                scrollArrowContainer.classList.remove(
                    "bd-dropdown-scroll-arrow-container-show"
                );

                appearedDateRef.current = null;
                logger.debug(
                    `useEffect: ${edge}: hide scroll arrow; set ` +
                    "appearedDateRef to null"
                );
            }
            else {
                // the scroll arrow should appear

                scrollArrowContainer.classList.add(
                    "bd-dropdown-scroll-arrow-container-show"
                );

                appearedDateRef.current = new Date();
                logger.debug(
                    `useEffect: ${edge}: show scroll arrow; set ` +
                    `appearedDateRef to: ${appearedDateRef.current}`
                );
                pointerHasLeftAtLeastOnceSinceAppearRef.current = false;
            }
        }
        else {
            logger.debug(
                `useEffect: ${edge}: scrollArrowContainerRef is null`
            );
        }

        return (): void => {
            logger.debug(
                `useEffect: ${edge}: appearedDateRef: cleanup`
            );
            appearedDateRef.current = null;
            pointerHasLeftAtLeastOnceSinceAppearRef.current = false;
        };

    }, [
        edge,
        isScrolledToEdge,
        ignoreClicksUntilNextPointerDownRef
    ]);

    return (
        <div
            className="bd-dropdown-scroll-arrow-sticky-container"
            data-position={edge}
        >
            <div
                className="bd-dropdown-scroll-arrow-container"
                ref={scrollArrowContainerRef}
            >
                <div
                    className="bd-dropdown-scroll-arrow"
                    ref={ref}
                    onClick={handleScrollArrowClick}
                    onPointerDown={handleScrollArrowPointerDown}
                    onPointerUp={handleScrollArrowPointerUp}
                    onPointerEnter={handleScrollArrowPointerEnter}
                    onPointerLeave={handleScrollArrowPointerLeave}
                    onPointerCancel={handleScrollArrowPointerLeave}
                    onPointerMove={handlePointerMove}
                >
                    <i className={arrowIconName}></i>
                </div>
            </div>
        </div>
    );
}

DropdownMenuScrollArrow.displayName = "DropdownMenuScrollArrow";
