import {
    type Dispatch,
    type SetStateAction,
    useCallback
} from "react";

/**
 * A hook that creates a state setter which transforms the next state using the
 * provided `transform` function before passing it to the original setter.
 *
 * @template T - The type of the state value.
 * @param setState - The original state setter function.
 * @param transform - A function that accepts the prev state and next state and
 * transforms the next state value.
 * @returns A new state setter function that applies the transformation before
 * setting the state. This function is memoized and will only change if
 * `setState` or `transform` change.
 */
export function useTransformingSetter<T>(
    setState: Dispatch<SetStateAction<T>>,
    transform: (prev: T, next: T) => T
): Dispatch<SetStateAction<T>> {
    return useCallback(
        (next: SetStateAction<T>): void => {
            setState((prev: T): T => {
                const resolvedNext = typeof next === "function"
                    ? (next as (value: T) => T)(prev)
                    : next;

                return transform(prev, resolvedNext);
            });
        },
        [setState, transform]
    );
}
