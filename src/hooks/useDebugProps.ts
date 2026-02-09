import { useEffect, useRef } from "react";

export type DebugPropChange<T> = {
    key: keyof T;
    prev: T[keyof T] | undefined;
    next: T[keyof T];
};

export function useDebugProps<T extends Record<string, unknown>>(
    props: T,
    label?: string
): void {
    const prevRef = useRef<T | null>(null);

    useEffect((): void => {
        const prev = prevRef.current;

        if (prev !== null) {
            const changes: DebugPropChange<T>[] = [];

            for (const key of Object.keys(props) as (keyof T)[]) {
                if (!Object.is(prev[key], props[key])) {
                    changes.push({
                        key,
                        prev: prev[key],
                        next: props[key]
                    });
                }
            }

            if (changes.length > 0) {
                const name = label ?? "Props changed";
                // eslint-disable-next-line no-console
                console.group(name);

                for (const change of changes) {
                    // eslint-disable-next-line no-console
                    console.log(
                        String(change.key),
                        "prev:",
                        change.prev,
                        "next:",
                        change.next
                    );
                }

                // eslint-disable-next-line no-console
                console.groupEnd();
            }
        }

        prevRef.current = props;
    });
}
