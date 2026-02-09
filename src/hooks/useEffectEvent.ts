import {
    useRef,
    useInsertionEffect
} from "react";

/**
 * A custom implementation of useEffectEvent for React. As of React 19.2, the
 * built-in useEffectEvent has a bug where it does not update the callback
 * reference for memoized components. See
 * https://github.com/facebook/react/issues/35187
 *
 */
export function useEffectEvent<T extends (...args: never[]) => unknown>(
    callback: T
): T {
    const fnRef = useRef<T | null>(null);

    // Update the ref in an insertion effect to ensure the latest callback
    // is used in the effect before even useLayoutEffect is called.
    useInsertionEffect(() => {
        fnRef.current = callback;
    });

    return ((...args: never[]): unknown => {
        if (!fnRef.current) {
            // eslint-disable-next-line no-console
            console.error(
                "custom useEffectEvent: cannot invoke callback before " +
                "component has mounted"
            );
        }
        return fnRef.current?.(...args);
    }) as T;
}
