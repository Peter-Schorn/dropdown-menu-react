import {
    useLayoutEffect
} from "react";

import { dropdownItemSlotProviderLogger as logger } from "../utils/loggers";

export type UseSlotSetter<T> = {
    setter: (value: T | null) => void;
    value: T;
};

export function useSlot<T extends readonly unknown[]>(
    ...setters: { [K in keyof T]?: UseSlotSetter<T[K]> | null }
): void {

    logger.debug(
        "useSlot: render; setters:\n",
        setters
    );

    // just the setter functions for cleanup
    const setterFns: UseSlotSetter<unknown>["setter"][] = setters.filter(
        (setter): setter is UseSlotSetter<unknown> => setter !== null
    ).map(
        (setter) => setter.setter
    );

    useLayoutEffect(() => {

        logger.debug(
            "useSlot: useLayoutEffect: setting slot values; setters:\n",
            setters
        );

        for (const slotSetter of setters) {
            if (slotSetter) {
                slotSetter.setter(slotSetter.value);
            }
        }

    }, [setters]);

    // use a separate effect for cleanup to avoid resetting slots on every
    // re-render
    useLayoutEffect(() => {
        return (): void => {

            logger.debug(
                "useSlot: cleanup: resetting slot values; setterFns:\n",
                setterFns
            );

            for (const setterFn of setterFns) {
                setterFn(null);
            }

        };
    }, [setterFns]);

}
