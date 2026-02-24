import {
    type JSX,
    type ReactNode,
    type PropsWithChildren,
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

/**
 * The props that a custom component must accept in order to be used as the `as`
 * prop of `DropdownToggle`.
 *
 * This is used for type checking to ensure that the custom component can
 * receive the necessary `onClick` handler from `DropdownToggle`.
 *
 * @public
 */
export type DropdownToggleAsRequiredProps = {
    onClick: (event: OnRequestOpenChangeEvent) => void;
};

/**
 * Own props for the {@link DropdownToggle} component.
 *
 * @public
 */
export type DropdownToggleOwnProps = PropsWithChildren & {
    /**
     * The class name to apply to the dropdown toggle element. Defaults to
     * "bd-dropdown-toggle".
     */
    className?: string;

    /**
     * optional user handler; can call event.preventDefault()
     */
    onClick?: (event: OnRequestOpenChangeEvent) => void;
};

type DropdownToggleAsAcceptingRequiredProps<T extends ElementType> =
    T extends keyof JSX.IntrinsicElements
        ? T
        : T extends JSXElementConstructor<infer Props>
            // if props contains `onClick`
            ? "onClick" extends keyof Props
                // Accept only `as` components whose `onClick` prop can receive
                // the handler that DropdownToggle provides. In assignability
                // terms, the target `onClick` type must be a compatible
                // supertype of our required handler type.
                ? DropdownToggleAsRequiredProps["onClick"] extends Props["onClick"]
                    ? T
                    : "DropdownToggle error: custom `as` component must accept `onClick?: (event: OnRequestOpenChangeEvent) => void`"
                : "DropdownToggle error: custom `as` component must accept `onClick?: (event: OnRequestOpenChangeEvent) => void`"
            : "DropdownToggle error: custom `as` component must accept `onClick?: (event: OnRequestOpenChangeEvent) => void`";

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
 * The `as` prop can be used to render a different element type instead of the
 * default "button". If a custom component is used with the `as` prop, it must
 * accept an `onClick` prop that can receive the toggle's click handler, which
 * has the signature `(event: OnRequestOpenChangeEvent) => void`.
 *
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

        // This component only uses the internal reasons, but a custom component
        // could use any reason it wants.
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

function CustomComponent(
    props: {
        foo: string;
        onClick: (event: OnRequestOpenChangeEvent) => void;
    }
): ReactNode {
    return null;
}

function CustomComponent2(
    props: {
        onClick?: (event: OnRequestOpenChangeEvent) => void;
    }
): ReactNode {
    return null;
}

function InvalidCustomComponent(
    props: {
        bar: string;
    }
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
                style={{
                    color: "blue",
                }}
                onClick={() => console.log("Link toggle clicked")}
            />

            <DropdownToggle
                as="a"
                href="#"
                data-xyz="test"
            />

            <DropdownToggle
                as="a"
                href="#"
                onClick={(e) => console.log("Link toggle clicked", e)}
            />

            <DropdownToggle
                as={CustomComponent}
                foo="test"
                onClick={() => console.log("Custom component toggle clicked")}
            />

            <DropdownToggle
                as={CustomComponent}
                foo="test"
            />

            <DropdownToggle
                as={CustomComponent2}
                onClick={() => console.log("Custom component toggle clicked")}
            />

            <DropdownToggle
                as={CustomComponent2}
            />

            <DropdownToggle
                // -@ts-expect-error -- Invalid `as` component that does not
                // accept the required `onClick` prop
                as={InvalidCustomComponent}
                bar="test"
            />
        </>
    );

}
/* eslint-enable */
