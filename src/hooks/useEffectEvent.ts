import {
    useRef,
    useInsertionEffect,
    useCallback
} from "react";

/**
 * A custom implementation of useEffectEvent for React. As of React 19.2, the
 * built-in useEffectEvent has a bug where it does not update the callback
 * reference for memoized components. See
 * https://github.com/facebook/react/issues/35187
 *
 * This implementation uses `useInsertionEffect` to update the callback
 * reference before any effects are run, ensuring that the latest callback is
 * always used.
 *
 * It also returns a stable function reference.
 */
export function useEffectEvent<Args extends unknown[], R>(
    callback: (...args: Args) => R
): typeof callback {

    const fnRef = useRef<(...args: Args) => R>(null);

    // Update the ref in an insertion effect to ensure the latest callback
    // is used in the effect before even useLayoutEffect is called.
    useInsertionEffect(() => {
        fnRef.current = callback;
    });

    return useCallback((...args: Args): R => {
        if (!fnRef.current) {
            throw new Error(
                "custom useEffectEvent: cannot invoke callback before " +
                "component has mounted"
            );
        }
        return fnRef.current(...args);
    }, []);
}
