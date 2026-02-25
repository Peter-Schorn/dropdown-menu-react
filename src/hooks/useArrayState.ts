import {
    type Dispatch,
    type SetStateAction
} from "react";

import {
    arraysAreEqualShallow
} from "../utils/MiscellaneousUtilities";

import { type WritableArrayInit } from "../types/misc";
import { useTransformedState } from "./useTransformedState";

/**
 * A hook that manages state can contains an array and provides a setter that
 * only updates the state if the new array is different from the current one
 * based on a **shallow** equality comparison of each of the elements.
 *
 * This prevents unnecessary re-renders when the new array has the same elements
 * as the previous array.
 */
export function useArrayState<T>(
    initialState: readonly T[] | (() => readonly T[])
): [readonly T[], Dispatch<SetStateAction<T[]>>] {

    return useTransformedState<T[]>({
        initialState: initialState as WritableArrayInit<typeof initialState>,
        transform: (prev, next) => {
            return arraysAreEqualShallow(prev, next) ? prev : next;
        },
        // technically the transform is NOT stable because, as it is an inline
        // function, it will be recreated on every render. However, since it
        // does not close over any values, it is effectively stable—or, more
        // accurately, static—as it has the same behavior every time.
        transformIsStable: true
    });

}
