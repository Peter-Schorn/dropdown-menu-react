import {
    type SetStateAction,
    type Dispatch,
    useRef,
    useCallback,
    useDebugValue
} from "react";

import { useTransformedState } from "./useTransformedState";

import { arraysAreEqualShallow } from "../utils/MiscellaneousUtilities";

import type {
    ReadonlyRefObject,
    ReadonlyIfArrayish,
    ReadonlyIfArrayishInit
} from "../types/misc";

export type UseStateRefReturn<T> = [
    ReadonlyIfArrayish<T>,
    Dispatch<SetStateAction<ReadonlyIfArrayish<T>>>,
    ReadonlyRefObject<ReadonlyIfArrayish<T>>
];

/**
 * A hook that manages state and also provides a ref that always has the current
 * state value. This can be useful in cases where you need to access the current
 * state value inside an asynchronous callback or an effect without having to
 * include the state variable in the dependency array.
 *
 * @typeParam T - The type of the state value.
 * @param initialState - The initial state value or a function that returns the
 * initial state value.
 * @param transform - An optional function that accepts the prev state and next
 * state and transforms the next state value.
 *
 * @returns A tuple containing the current state value, a setter function to
 * update the state, and a ref object that always has the current state value.
 */
export function useStateRef<T>(
    initialState: ReadonlyIfArrayishInit<T>,
    transform?: (
        prev: ReadonlyIfArrayish<T>,
        next: ReadonlyIfArrayish<T>
    ) => ReadonlyIfArrayish<T>,
    transformIsStable?: boolean
): UseStateRefReturn<T> {

    type ReadonlyT = ReadonlyIfArrayish<T>;

    const [state, setState] = useTransformedState<ReadonlyT>({
        initialState,
        transform,
        transformIsStable
    });

    useDebugValue(state);

    const stateRef = useRef<ReadonlyT>(state);

    // react doesn't recognize the `setState` function returned by
    // `useTransformedState` is stable
    const setStateAndRef = useCallback((
        setStateInner: SetStateAction<ReadonlyT>
    ): void => {

        let newState: ReadonlyT;

        if (typeof setStateInner === "function") {
            const setStateFn = setStateInner as (prevState: ReadonlyT) => ReadonlyT;
            newState = setStateFn(stateRef.current);
        }
        else {
            newState = setStateInner;
        }

        if (newState === stateRef.current) {
            // the state hasn't changed
            return;
        }

        // the only place the ref should be updated is inside this function
        stateRef.current = newState;

        // update the state
        setState(newState);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return [state, setStateAndRef, stateRef];
}

/**
 * A hook that manages state that contains an array and also provides a ref that
 * always has the current state value. This can be useful in cases where you
 * need to access the current state value inside an asynchronous callback or an
 * effect without having to include the state variable in the dependency array.
 *
 * Only updates the state if the new array is different from the current one
 * based on a **shallow** equality comparison of each of the elements. This
 * prevents unnecessary re-renders when the new array has the same elements as
 * the previous array.
 *
 * @typeParam T - The type of the state value.
 * @param initialState - The initial state value or a function that returns the
 * initial state value.
 *
 * @returns A tuple containing the current state value, a setter function to
 * update the state, and a ref object that always has the current state value.
 */
export function useArrayStateRef<T>(
    initialState: readonly T[] | (() => readonly T[])
): UseStateRefReturn<T[]> {
    return useStateRef<T[]>(
        initialState,
        (prev, next) => {
            return arraysAreEqualShallow(prev, next) ? prev : next;
        },
        // technically the transform is NOT stable because, as it is an inline
        // function, it will be recreated on every render. However, since it
        // does not close over any values, it is effectively stable as it has
        // the same behavior every time.
        true
    );
}
