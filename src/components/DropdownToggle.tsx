import {
    type JSX,
    type ReactNode,
    type PropsWithChildren,
    type ComponentPropsWithRef,
    type ElementType,
    type JSXElementConstructor,
    useCallback,
} from "react";

import type {
    RequestOpenChangeReasonInternal,
    RequestOpenChangeEvent
} from "../components/Dropdown";

import {
    useDropdownToggle
} from "../hooks/useDropdownToggle";

/**
 * The props that a custom component must accept in order to be used as the `as`
 * prop of {@link DropdownToggle}.
 *
 * The custom component must accept the following props:
 * - `onClick`: A function that should be called when the toggle is clicked. The
 *    signature `(event: OnRequestOpenChangeEvent) => void` must be assignable
 *    to this prop. When this function is called, it will trigger the default
 *    toggle behavior of toggling the open state of the dropdown menu.
 * - `ref`: A ref that should be attached to the underlying DOM element that is
 *    rendered by the custom component. This allows the dropdown menu to
 *    position itself correctly relative to the toggle. It must be an
 *    `HTMLElement` or a subtype thereof.
 *
 * @public
 */
export type DropdownToggleAsRequiredProps = {
    onClick?: (event: RequestOpenChangeEvent) => void;
    ref?: (element: HTMLElement | null) => void;
};

/**
 * Own props for the {@link DropdownToggle} component.
 *
 * @public
 */
export type DropdownToggleOwnProps = PropsWithChildren & {
    /**
     * The class name to apply to the dropdown toggle element. Defaults to
     * `bd-dropdown-toggle`.
     */
    className?: string;

    /**
     * Optional click handler. Can call `event.preventDefault()` to prevent the
     * default toggle behavior of opening/closing the dropdown menu.
     */
    onClick?: (event: RequestOpenChangeEvent) => void;
};

/**
 * A type-level validation to ensure that the `as` prop provided to
 * `DropdownToggle` is a valid element type that can be used as the toggle. The
 * `as` prop is valid if it is either:
 * - An intrinsic element (e.g. "button", "a", "div", etc.), since all intrinsic
 *   elements accept `onClick` and `ref` props with compatible types.
 * - A custom component that accepts an `onClick` prop that can receive the
 *   toggle's click handler (i.e. `(event: OnRequestOpenChangeEvent) => void`)
 *   and a `ref` prop that can receive the toggle's ref (i.e.
 *   `Ref<HTMLElement>`).
 *
 * @internal
 */
export type _DropdownToggleAsValidation<T extends ElementType> =
    // all intrinsic elements are valid `as` targets since they all accept an
    // `onClick` prop with a compatible type
    T extends keyof JSX.IntrinsicElements
        ? T
        : T extends JSXElementConstructor<infer Props>
            // ensure the `onClick` prop is present
            ? "onClick" extends keyof Props
                // Ensure the `onClick` prop is compatible with the toggle's
                // click handler. Specifically,
                // `(event: OnRequestOpenChangeEvent) => void` must be
                // assignable to the `onClick` prop of the custom component.
                // This requires that the type of the `event` parameter in the
                // custom component's `onClick` prop is a subtype of
                // `OnRequestOpenChangeEvent`.
                ? NonNullable<DropdownToggleAsRequiredProps["onClick"]> extends Props["onClick"]
                    ? "ref" extends keyof Props
                        ? NonNullable<DropdownToggleAsRequiredProps["ref"]> extends Props["ref"]
                            ? T
                            : "DropdownToggle error: custom `as` must accept compatible ref"
                        : "DropdownToggle error: custom `as` must declare ref"
                    : "DropdownToggle error: custom `as` must accept compatible onClick"
                : "DropdownToggle error: custom `as` must declare onClick"
            : "DropdownToggle error: invalid `as` type";

/**
 * Props for the {@link DropdownToggle} component.
 *
 * Requires the chosen `as` target supports an `onClick` prop compatible with
 * `OnRequestOpenChangeEvent`. See also {@link DropdownToggleAsRequiredProps}
 * for the required props for a custom `as` component.
 *
 * @public
 */
export type DropdownToggleProps<T extends ElementType = "button"> =
    {
        /**
         * The element type to render as. Defaults to "button".
         */
        as?: _DropdownToggleAsValidation<T>;
    } & DropdownToggleOwnProps &
    Omit<
        ComponentPropsWithRef<T>,
            | keyof DropdownToggleOwnProps
            | keyof DropdownToggleAsRequiredProps
            | "as"
    >;

/**
 * A dropdown toggle component that serves as the trigger for opening and
 * closing the dropdown menu. It should be used as a child of the `Dropdown`
 * component.
 *
 * Calling `event.preventDefault()` in the `onClick` handler of the toggle will
 * prevent the default toggle behavior, which is to toggle the open state of the
 * dropdown menu.
 *
 * The `as` prop can be used to render a different element type instead of the
 * default "button". If a custom component is used with the `as` prop, it must
 * accept the following props:
 * - `onClick`: A function that should be called when the toggle is clicked. The
 *    signature `(event: OnRequestOpenChangeEvent) => void` must be assignable
 *    to this prop. When this function is called, it will trigger the default
 *    toggle behavior of toggling the open state of the dropdown menu.
 * - `ref`: A ref that should be attached to the underlying DOM element that is
 *    rendered by the custom component. This allows the dropdown menu to
 *    position itself correctly relative to the toggle. It must be an
 *    `HTMLElement` or a subtype thereof.
 *
 * See {@link DropdownToggleAsRequiredProps}.
 *
 * @public
 */
export function DropdownToggle<T extends ElementType = "button">(
    {
        as,
        className = "bd-dropdown-toggle",
        onClick,
        children,
        ...rest
    }: DropdownToggleProps<T>
): ReactNode {

    const {
        isOpen,
        requestOpenChange,
        dropdownToggleRef
    } = useDropdownToggle();

    const handleClick = useCallback((
        event: RequestOpenChangeEvent
    ): void => {

        // call user's handler first (optional) so they can preventDefault
        onClick?.(event);

        // if the user called `event.preventDefault()` in their onClick handler,
        // do not proceed with the default toggle behavior
        if (event.defaultPrevented) {
            return;
        }

        // This component only uses the internal reasons, but a custom component
        // could use any reason it wants.
        const reason: RequestOpenChangeReasonInternal = "clickToggle";

        // request that the dropdown menu to toggle its open state
        requestOpenChange({
            open: (prevIsOpen) => !prevIsOpen,
            reason,
            event
        });

    }, [
        requestOpenChange,
        onClick
    ]);

    const setRef = useCallback((
        element: HTMLElement | null
    ): void => {
        dropdownToggleRef.current = element;
    }, [
        dropdownToggleRef
    ]);

    // const Component = (as ?? "button") as ElementType;
    const Component = as ?? "button";

    const isButton = Component === "button";

    // Default props to pass in if the component is a button: type="button" to
    // prevent accidental form submission. These can still be overridden by the
    // client if necessary.
    const defaultButtonProps = isButton ? { type: "button" } as const : {};

    return (
        <Component
            {...defaultButtonProps}
            className={className}
            // attach this data attribute so that clients can style the toggle
            // based on whether the menu is open or closed using CSS attribute
            // selectors (e.g. `[data-open="true"]` or `[data-open="false"]`)
            data-open={isOpen}
            {...rest}
            // these should override any user-provided props since they are
            // required for the toggle to function correctly
            ref={setRef}
            onClick={handleClick}
        >
            {children}
        </Component>
    );
}

// use any to exclude from the generated .d.ts file
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
(DropdownToggle as any).displayName = "DropdownToggle";
