import {
    useState,
    type Dispatch,
    type SetStateAction
} from "react";

import { useTransformingSetter } from "./useTransformingSetter";

import {
    arraysAreEqualShallow
} from "../utils/MiscellaneousUtilities";


/**
 * A hook that manages an array state and provides a setter that only updates
 * the state if the new array is different from the current one based on a
 * **shallow** equality comparison of each of the elements.
 *
 * This prevents unnecessary re-renders when the new array has the same elements
 * as the previous array.
 */
export function useArrayState<T>(
    initialState: T[] | (() => T[])
): [T[], Dispatch<SetStateAction<T[]>>] {

    const [state, setState] = useState<T[]>(initialState);

    const setArrayState = useTransformingSetter<T[]>(setState, (prev, next) => {
        return arraysAreEqualShallow(prev, next) ? prev : next;
    });

    return [state, setArrayState];
}
