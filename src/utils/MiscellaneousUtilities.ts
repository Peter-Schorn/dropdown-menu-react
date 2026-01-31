import { flushSync } from "react-dom";

export type HorizontalEdge = "left" | "right";
export type VerticalEdge = "top" | "bottom";

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
 * @param options - An object containing the min and max values.
 * @param options.min - The minimum value.
 * @param options.max - The maximum value.
 * @returns The clamped value.
 *
 * @example
 * ```typescript
 * // clampedValue will be 5
 * const clampedValue = clamp(10, { min: 0, max: 5 });
 * ```
 */
export function clamp(value:  number, { min, max }: ClampOptions): number {
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
 * @param rectA The first DOMRect object.
 * @param rectB The second DOMRect object.
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
 * @param event the event to test.
 * @param rect the DOMRect to test against.
 * @returns `true` if the event occurred within the DOMRect; otherwise,
 * `false`.
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
 * @param arrayA The first array.
 * @param arrayB The second array.
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
 * @param objA The first object.
 * @param objB The second object.
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

