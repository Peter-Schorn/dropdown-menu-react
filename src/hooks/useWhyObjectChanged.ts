import { useEffect, useRef } from "react";

export type ObjectChange = {
    previous: unknown;
    current: unknown;
};

export type ObjectChangeInfo = {
    name: string;
    hasChanges: boolean;
    changedKeys: string[];
    changes: Record<string, ObjectChange>;
    previous: unknown;
    current: unknown;
    objectsAreSame: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function hasOwn(obj: Record<string, unknown>, key: string): boolean {
    return Object.prototype.hasOwnProperty.call(obj, key);
}

function getChanges(
    previous: unknown,
    current: unknown
): Record<string, ObjectChange> {
    const changes: Record<string, ObjectChange> = {};

    const previousIsRecord = isRecord(previous);
    const currentIsRecord = isRecord(current);

    // the context value is not an object, so we can only compare the previous
    // and current values directly
    if (!previousIsRecord || !currentIsRecord) {
        if (!Object.is(previous, current)) {
            changes.value = {
                previous,
                current
            };
        }
        return changes;
    }

    const keys = new Set<string>([
        ...Object.keys(previous),
        ...Object.keys(current)
    ]);

    for (const key of keys) {
        const previousHasKey = hasOwn(previous, key);
        const currentHasKey = hasOwn(current, key);
        const previousValue = previousHasKey ? previous[key] : undefined;
        const currentValue = currentHasKey ? current[key] : undefined;

        if (previousHasKey !== currentHasKey ||
            !Object.is(previousValue, currentValue)) {
            changes[key] = {
                previous: previousValue,
                current: currentValue
            };
        }
    }

    return changes;
}

export function useWhyObjectChanged<T>(
    label: string,
    object: T
): ObjectChangeInfo {

    const previousRef = useRef<T | undefined>(undefined);

    // eslint-disable-next-line react-hooks/refs
    const changes = previousRef.current === undefined
        ? {}
        // eslint-disable-next-line react-hooks/refs
        : getChanges(previousRef.current, object);

    const changedKeys = Object.keys(changes);

    // eslint-disable-next-line react-hooks/refs
    const objectsAreSame = Object.is(previousRef.current, object);

    useEffect(() => {
        previousRef.current = object;
    });

    return {
        name: label,
        hasChanges: changedKeys.length > 0 || !objectsAreSame,
        changedKeys,
        changes,
        // eslint-disable-next-line react-hooks/refs
        previous: previousRef.current,
        current: object,
        objectsAreSame
    };
}
