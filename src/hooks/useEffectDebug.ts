import {
    useEffect,
    useRef
} from "react";

type DebugEffectInfo<T extends readonly unknown[]> = {
    prev: T | null;
    next: T;
    changed: number[];
    changedNames?: string[];
};

export function useEffectDebug<T extends readonly unknown[]>(
    effect: (info: DebugEffectInfo<T>) => void | (() => void),
    deps: T,
    depNames?: readonly string[]
): void {

    const prevDepsRef = useRef<T | null>(null);

    useEffect(() => {
        const prev = prevDepsRef.current;

        const changed: number[] = [];

        if (prev !== null) {
            for (let i = 0; i < deps.length; i++) {
                if (!Object.is(prev[i], deps[i])) {
                    changed.push(i);
                }
            }
        }

        const info: DebugEffectInfo<T> = {
            prev,
            next: deps,
            changed,
            changedNames:
                depNames && changed.length > 0
                    ? changed.map(i => depNames[i] ?? `#${i}`)
                    : undefined
        };

        prevDepsRef.current = deps;

        return effect(info);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
}
