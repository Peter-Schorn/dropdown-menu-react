import {
    type JSX,
    type ReactNode,
    type ComponentPropsWithRef,
    type ElementType,
    type JSXElementConstructor,
    useContext,
    useCallback,
} from "react";

import type {
    OnRequestOpenChangeReasonInternal,
    OnRequestOpenChangeEvent
} from "../components/Dropdown";

import {
    DropdownToggleContext
} from "../model/context/DropdownToggleContext";

type DropdownToggleRequiredTargetProps = {
    onClick: (event: OnRequestOpenChangeEvent) => void;
};

type DropdownToggleOwnProps = {
    className?: string;
    children?: ReactNode;

    /**
     * optional user handler; can call event.preventDefault()
     */
    onClick?: (event: OnRequestOpenChangeEvent) => void;
};

// type DropdownToggleAsAcceptingRequiredProps<T extends ElementType> =
//     T extends keyof JSX.IntrinsicElements
//         ? T
//         // extract the props of the component
//         : T extends JSXElementConstructor<infer Props>
//             // if props contains `onClick`
//             ? "onClick" extends keyof Props
//                 // And if the type of `onClick` is compatible with the required
//                 // type: Require a super type because function parameters are
//                 // contravariant.
//                 ? DropdownToggleRequiredTargetProps["onClick"] extends Props["onClick"]
//                     ? T
//                     : never
//                 : never
//             : never;

type DropdownToggleAsError = {
  __dropdownToggleAsError__: "Custom `as` component must accept `onClick?: (event: OnRequestOpenChangeEvent) => void`";
};

type DropdownToggleAsAcceptingRequiredProps<T extends ElementType> =
    T extends keyof JSX.IntrinsicElements
        ? T
        : T extends JSXElementConstructor<infer Props>
            // if props contains `onClick`
            ? "onClick" extends keyof Props
                // And if the type of `onClick` is compatible with the required
                // type: Require a super type because function parameters are
                // contravariant.
                ? DropdownToggleRequiredTargetProps["onClick"] extends Props["onClick"]
                    ? T
                    : DropdownToggleAsError
                : DropdownToggleAsError
            : DropdownToggleAsError;

/**
 * Props for the {@link DropdownToggle} component.
 *
 * Requires the chosen `as` target supports an `onClick` prop compatible with
 * `OnRequestOpenChangeEvent`.
 *
 * @public
 */
export type DropdownToggleProps<T extends ElementType = "button"> =
    {
        /**
         * The element type to render as. Defaults to "button".
         */
        as?: DropdownToggleAsAcceptingRequiredProps<T>;
    } & DropdownToggleOwnProps &
    Omit<
        ComponentPropsWithRef<T>,
        keyof DropdownToggleOwnProps | "as"
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

    const Component = as ?? "button";

    const { requestOpenChange } = useContext(DropdownToggleContext);

    const handleClick = useCallback((
        event: OnRequestOpenChangeEvent
    ): void => {

        // call user's handler first (optional) so they can preventDefault
        onClick?.(event);

        if (event.defaultPrevented) {
            return;
        }

        const reason: OnRequestOpenChangeReasonInternal = "clickToggle";

        requestOpenChange({
            open: (prevIsOpen) => !prevIsOpen,
            reason,
            event
        });

    }, [
        requestOpenChange,
        onClick
    ]);

    const isButton = Component === "button";

    // Default props to pass in if the component is a button: type="button" to
    // prevent accidental form submission. These can still be overridden by the
    // user if necessary.
    const defaultButtonProps = isButton ? { type: "button" } as const : {};

    return (
        <Component
            {...defaultButtonProps}
            className={className}
            onClick={handleClick}
            {...rest}
        >
            {children}
        </Component>
    );
}

DropdownToggle.displayName = "DropdownToggle";


/* eslint-disable
       no-console,
    @typescript-eslint/no-unused-vars
*/

type CustomComponentProps = {
    foo: string;
    // onClick?: (event: OnRequestOpenChangeEvent) => void;
};

function CustomComponent(
    props: CustomComponentProps
): ReactNode {
    return null;
}

function TestDropdownToggle(): JSX.Element {

    return (
        <>
            <DropdownToggle />
            <DropdownToggle
                onClick={() => console.log("Toggle clicked")}
            />
            <DropdownToggle
                onClick={() => console.log("Toggle clicked")}
            >
                Toggle with children world is cool
            </DropdownToggle>
            <DropdownToggle
                as="a"
                href="#"
                onClick={() => console.log("Link toggle clicked")}
            />
            <DropdownToggle
                as="a"
                href="#"
            />
            <DropdownToggle
                // -@ts-expect-error
                as={CustomComponent}
                foo="test"
                onClick={() => console.log("Custom component toggle clicked")}
            />
        </>
    );

}
/* eslint-enable */
