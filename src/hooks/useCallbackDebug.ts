import { useCallback, useRef } from "react";

export type DebugCallbackInfo<T extends readonly unknown[]> = {
    prevDeps: T | null;
    nextDeps: T;
    changed: number[];
    changedNames?: string[];
};

export type DebugCallbackWrappedFn<
    Fn extends (...args: never[]) => unknown,
    T extends readonly unknown[]
> = Fn & {
    _debug?: DebugCallbackInfo<T>;
};

export function useCallbackDebug<
    Fn extends (...args: never[]) => unknown,
    T extends readonly unknown[]
>(
    fn: Fn,
    deps: T,
    depNames: readonly string[],
    onChange?: (info: DebugCallbackInfo<T>) => void
): DebugCallbackWrappedFn<Fn, T> {

    const prevDepsRef = useRef<T | null>(null);
    const debugInfoRef = useRef<DebugCallbackInfo<T> | null>(null);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const memoizedFn = useCallback(fn, deps);

    const prev = prevDepsRef.current;
    const changed: number[] = [];

    if (prev !== null) {
        for (let i = 0; i < deps.length; i++) {
            if (!Object.is(prev[i], deps[i])) {
                changed.push(i);
            }
        }
    }

    debugInfoRef.current = {
        prevDeps: prev,
        nextDeps: deps,
        changed,
        changedNames:
            depNames && changed.length > 0
                ? changed.map(i => depNames[i] ?? `#${i}`)
                : undefined
    };

    prevDepsRef.current = deps;

    // attach debug metadata
    const wrapped = memoizedFn as DebugCallbackWrappedFn<Fn, T>;
    wrapped._debug = debugInfoRef.current ?? undefined;

    if (
        onChange &&
        changed.length > 0 &&
        debugInfoRef.current
    ) {
        onChange(debugInfoRef.current);
    }

    return wrapped;
}
