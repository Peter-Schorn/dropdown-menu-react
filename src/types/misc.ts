import {
    type RefObject
} from "react";

export type HorizontalEdge = "left" | "right";
export type VerticalEdge = "top" | "bottom";

/**
 * Strips the readonly modifier from all properties of a type, making them
 * writable.
 */
export type Writable<T> = {
    -readonly [P in keyof T]: T[P];
};

/**
 * Strips the readonly modifier from `readonly T[] | (() => readonly T[])`.
 */
export type WritableArrayInit<T> =
    T extends readonly (infer U)[] ? U[] :
    T extends () => readonly (infer U)[] ? () => U[] :
    never;

/**
 * A readonly RefObject.
 */
export type ReadonlyRefObject<T> = Readonly<RefObject<T>>;


/**
 * Extracts the element type from an array. For example, `ElementType<string[]>`
 * would be `string`.
 */
export type ElementType<T> = T extends readonly (infer U)[] ? U : never;

/**
 * If T is an array or tuple type, returns a readonly version of that type.
 * Otherwise, returns T unmodified.
 */
export type ReadonlyIfArrayish<T> = T extends unknown[]
    ? Readonly<T>
    : T;

/**
 * Transforms `T` into `ReadonlyIfArrayish<T> | () => ReadonlyIfArrayish<T>` for
 * use in a `useState` initializer.
 */
export type ReadonlyIfArrayishInit<T> =
    ReadonlyIfArrayish<T> | (() => ReadonlyIfArrayish<T>);
