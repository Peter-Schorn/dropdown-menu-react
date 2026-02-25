import {
    type Dispatch,
    type SetStateAction,
    useCallback
} from "react";

export type UseTransformingSetterOptions<T> = {
    setState: Dispatch<SetStateAction<T>>;
    transform?: (prev: T, next: T) => T;
    transformIsStable?: boolean;
};

/**
 * A hook that creates a state setter which transforms the next state using the
 * provided `transform` function before passing it to the original setter.
 *
 * @typeParam T - The type of the state value.
 * @param options - Options for the transforming setter:
 * - `setState`: The original state setter function. It must be stable.
 * - `transform`: A function that accepts the prev state and next state and
 *   transforms the next state value. If not provided, the `setState` argument
 *   will be returned as-is without any transformation. Do not change whether
 *   `transform` is provided or not between renders.
 * - `transformIsStable`: If `true`, indicates that the `transform` function is
 *   stable and does not need to be included in the dependency array of the
 *   `useCallback` that wraps the returned setter function. This can be used as
 *   an optimization if the caller knows that the `transform` function will not
 *   change between renders. Default: `false`. Do not change the this value
 *   between renders.
 *
 * @returns A new state setter function that applies the transformation before
 * setting the state. This function is memoized and will only change if
 * `transformIsStable` is `false` and `transform` changes.
 */
export function useTransformingSetter<T>(
    {
        setState,
        transform,
        transformIsStable = false
    }: UseTransformingSetterOptions<T>
): Dispatch<SetStateAction<T>> {

    const dependencies = transformIsStable || !transform
        ? []
        : [transform];

    const setter = useCallback(
        (next: SetStateAction<T>): void => {
            setState((prev: T): T => {
                const resolvedNext = typeof next === "function"
                    ? (next as (value: T) => T)(prev)
                    : next;

                return transform!(prev, resolvedNext);
            });
        },
        // eslint-disable-next-line react-hooks/use-memo, react-hooks/exhaustive-deps
        dependencies
    );

    if (transform) {
        return setter;
    }
    else {
        return setState;
    }
}
