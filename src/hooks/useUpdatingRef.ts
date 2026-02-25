import { useRef } from "react";

import type {
    ReadonlyIfArrayish,
    ReadonlyRefObject
} from "../types/misc";

/**
 * Returns a ref whose `current` value is updated during every render.
 * Arrays/tuples are exposed as readonly.
 *
 * This is useful for imperative reads that must always observe the latest
 * value, including during render work that may never commit.
 */
export function useUpdatingRef<T>(
    value: ReadonlyIfArrayish<T>
): ReadonlyRefObject<ReadonlyIfArrayish<T>> {

    const valueRef = useRef<ReadonlyIfArrayish<T>>(value);

    // eslint-disable-next-line react-hooks/refs
    valueRef.current = value;

    return valueRef;
}
