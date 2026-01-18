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
 * @param rectA The first DOMRect object.
 * @param rectB The second DOMRect object.
 * @returns `true` if the DOMRect objects are equal; otherwise, `false`.
 */
export function domRectsAreEqual(
    rectA: DOMRect | null,
    rectB: DOMRect | null
): boolean {

    if (rectA === rectB) {
        return true;
    }

    return (
        rectA?.x === rectB?.x &&
        rectA?.y === rectB?.y &&
        rectA?.width === rectB?.width &&
        rectA?.height === rectB?.height &&
        rectA?.top === rectB?.top &&
        rectA?.right === rectB?.right &&
        rectA?.bottom === rectB?.bottom &&
        rectA?.left === rectB?.left
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
