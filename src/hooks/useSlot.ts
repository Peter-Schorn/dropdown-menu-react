import {
    type ReactNode,
    useLayoutEffect
} from "react";


export function useSlot(
    setter: (node: ReactNode | null) => void,
    children: ReactNode
): null {
    useLayoutEffect(() => {
        setter(children);
    }, [children, setter]);

    useLayoutEffect(() => {
        return (): void => {
            setter(null);
        };
    }, [setter]);

    return null;
}
