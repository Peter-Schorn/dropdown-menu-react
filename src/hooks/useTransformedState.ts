import {
    type Dispatch,
    type SetStateAction,
    useState,
    useDebugValue
} from "react";

import { useTransformingSetter } from "./useTransformingSetter";

export type UseTransformedStateOptions<T> = {
    initialState: T | (() => T);
    transform?: (prev: T, next: T) => T;
    transformIsStable?: boolean;
};

export function useTransformedState<T>(
    {
        initialState,
        transform,
        transformIsStable = false
    }: UseTransformedStateOptions<T>
): [T, Dispatch<SetStateAction<T>>] {

    const [state, setState] = useState<T>(initialState);

    useDebugValue(state);

    const setTransformedState = useTransformingSetter<T>({
        setState,
        transform,
        transformIsStable
    });

    return [state, setTransformedState];
}
