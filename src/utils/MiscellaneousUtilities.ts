import type {
    ReactNode
} from "react";

import { flushSync } from "react-dom";

import {
    subscribeToDebugConfig,
    getDebugConfig
} from "./debugConfig";

import type {
    UpdateState
} from "../types/misc";

/**
 * Whether the primary input device is a touch screen.
 *
 * Uses the CSS media query `(pointer: coarse) and (hover: none)`.
 */
export const isPrimarilyTouchDevice = window.matchMedia(
    "(pointer: coarse) and (hover: none)"
).matches;

export const isWebkit = navigator.userAgent.includes("AppleWebKit") &&
    !navigator.userAgent.includes("Chrome");

export type ClampOptions = {
    min: number;
    max: number;
};

/**
 * Clamps a value between a minimum and maximum range.
 *
 * @param value - The value to clamp.
 * @param options - An object containing the min and max values:
 * - `min`: The minimum value.
 * - `max`: The maximum value.
 * @returns The clamped value.
 *
 * @example
 * ```typescript
 * // clampedValue will be 5
 * const clampedValue = clamp(10, { min: 0, max: 5 });
 * ```
 */
export function clamp(value: number, { min, max }: ClampOptions): number {
    let resolvedMin: number;
    let resolvedMax: number;

    if (min <= max) {
        resolvedMin = min;
        resolvedMax = max;
    }
    else {
        // handle case where min > max
        resolvedMin = max;
        resolvedMax = min;
    }

    return Math.max(resolvedMin, Math.min(resolvedMax, value));
}

/**
 * Compares two DOMRect objects for equality.
 *
 * @param rectA - The first DOMRect object.
 * @param rectB - The second DOMRect object.
 * @returns `true` if the DOMRect objects are equal; otherwise, `false`.
 */
export function domRectsAreEqual(
    rectA: DOMRectReadOnly | null,
    rectB: DOMRectReadOnly | null
): boolean {

    if (rectA === rectB) {
        return true;
    }

    return (
        rectA?.x === rectB?.x &&
        rectA?.y === rectB?.y &&
        rectA?.width === rectB?.width &&
        rectA?.height === rectB?.height
    );
}

export type DomRectTestableEvent = {
    readonly clientX: number;
    readonly clientY: number;
};

/**
 * Determines if the given event occurred within the given DOMRect using the
 * `clientX` and `clientY` properties of the event.
 *
 * @param event - The event to test.
 * @param rect - The DOMRect to test against.
 * @returns `true` if the event occurred within the DOMRect; otherwise, `false`.
 */
export function eventWithinDomRect(
    event: DomRectTestableEvent,
    rect: DOMRectReadOnly
): boolean {

    return (
        event.clientX > rect.left &&
        event.clientX < rect.right &&
        event.clientY > rect.top &&
        event.clientY < rect.bottom
    );

}

/**
 * Flushes updates synchronously if the given condition is `true`. Otherwise,
 * just calls the given function directly.
 *
 * @param condition - The condition to test.
 * @param func - The function to call.
 */
export function flushSyncIf(
    condition: boolean,
    func: () => void
): void {
    if (condition) {
        flushSync(func);
    }
    else {
        func();
    }
}


/**
 * Compares two arrays for **shallow** equality by comparing each of their
 * elements.
 *
 * @param arrayA - The first array.
 * @param arrayB - The second array.
 *
 * @returns `true` if the arrays are equal; otherwise, `false`.
 */
export function arraysAreEqualShallow<T>(
    arrayA: readonly T[] | null,
    arrayB: readonly T[] | null
): boolean {
    if (arrayA === arrayB) {
        return true;
    }

    if (arrayA === null || arrayB === null) {
        return false;
    }

    if (arrayA.length !== arrayB.length) {
        return false;
    }

    for (let i = 0; i < arrayA.length; i++) {
        if (arrayA[i] !== arrayB[i]) {
            return false;
        }
    }

    return true;
}

/**
 * Compares two objects for **shallow** equality by comparing each of their
 * properties.
 *
 * @param objA - The first object.
 * @param objB - The second object.
 *
 * @returns `true` if the objects are equal; otherwise, `false`.
 */
export function objectsAreEqualShallow<T extends Record<string, unknown>>(
    objA: T,
    objB: T
): boolean {
    const keysA = Object.keys(objA);
    const keysB = Object.keys(objB);

    if (keysA.length !== keysB.length) {
        return false;
    }

    for (const key of keysA) {
        if (objA[key] !== objB[key]) {
            return false;
        }
    }

    return true;
}

export function assert(
    condition: boolean,
    message: string
): asserts condition {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`);
    }
}

export function summarizeReactChildren(children: ReactNode): unknown {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    /* eslint-disable @typescript-eslint/no-unsafe-assignment */
    /* eslint-disable @typescript-eslint/no-unsafe-member-access */
    /* eslint-disable @typescript-eslint/no-unsafe-argument */
    if (Array.isArray(children)) {
        return children.map(summarizeReactChildren);
    }

    if (typeof children === "object" && children !== null) {
        const el = children as any;

        return {
            type: el.type?.name ?? el.type,
            key: el.key,
            propKeys: el.props ? Object.keys(el.props) : null
        };
    }

    return children;
    /* eslint-enable */
}

subscribeToDebugConfig(() => {
    if (getDebugConfig().exposeDebugUtilitiesOnWindow) {
        window.summarizeReactChildren = summarizeReactChildren;
    }
    else {
        delete window.summarizeReactChildren;
    }
});

/**
 * Gets the next state value based on the given update, which can be either a
 * new state value or a function that takes the previous state and returns the
 * new state value.
 *
 * @param update - The new state value or a function that returns the new state
 * value based on the previous state.
 * @param prevState - The previous state value.
 * @returns The next state value.
 */
export function getNextState<T>(
    update: UpdateState<T>,
    prevState: T
): T {

    if (typeof update === "function") {
        return (update as (prevValue: T) => T)(prevState);
    }
    else {
        return update;
    }
}

/**
 * Determines whether a value implements the ECMAScript iterable protocol.
 *
 * This checks for the presence of the `Symbol.iterator` method, which is the
 * runtime indicator that a value can be used in constructs such as `for...of`,
 * spread syntax, and `Array.from`.
 *
 * The generic parameter `T` represents the element type yielded by the
 * iterable. This cannot be verified at runtime and is only used to help
 * TypeScript narrow the type when the function returns `true`.
 *
 * Does not verify that the iterator symbol actually implements the correct call
 * signature for an iterable.
 *
 * @typeParam T - The expected element type produced by the iterable.
 * @param value - The value to test.
 * @returns `true` if the value appears to implement `Iterable<T>`.
 */
export function isIterable<T>(value: unknown): value is Iterable<T> {
    if (value === null || value === undefined) {
        return false;
    }

    if (typeof value !== "object" && typeof value !== "function") {
        return false;
    }

    return Symbol.iterator in value;
}
