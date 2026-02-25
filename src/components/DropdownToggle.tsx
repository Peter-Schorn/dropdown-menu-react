import {
    type JSX,
    type ReactNode,
    type PropsWithChildren,
    type ComponentPropsWithRef,
    type ElementType,
    type JSXElementConstructor,
    type MouseEventHandler,
    type SyntheticEvent,
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
 * prop of {@link DropdownToggle}.
 *
 * This is used for type checking to ensure that the custom component can
 * receive the necessary `onClick` handler from {@link DropdownToggle}.
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
     * `bd-dropdown-toggle`.
     */
    className?: string;

    /**
     * Optional click handler. Can call event.preventDefault() to prevent the
     * default toggle behavior of opening/closing the dropdown menu.
     */
    onClick?: (event: OnRequestOpenChangeEvent) => void;
};

type DropdownToggleAsValidation<T extends ElementType> =
    T extends keyof JSX.IntrinsicElements
        ? T
        : T extends JSXElementConstructor<infer Props>
            ? "onClick" extends keyof Props
                ? DropdownToggleAsRequiredProps["onClick"] extends Props["onClick"]
                    ? T
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
        as?: DropdownToggleAsValidation<T>;
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
 * has the signature `(event: OnRequestOpenChangeEvent) => void`. See
 * {@link DropdownToggleAsRequiredProps} for the required props for a custom
 * `as` component.
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

function CustomComponent3(
    props: {
        onClick: (event: OnRequestOpenChangeEvent) => void | undefined | null;
        bar?: number;
    }
): ReactNode {
    return null;
}


function CustomComponent4(
    props: {
        foo: string;
        bar: number;
        onClick: (event: OnRequestOpenChangeEvent) => void;
    }
): ReactNode {
    return null;
}

function CustomComponent5(
    props: {
        foo: string;
        onClick: ((event: OnRequestOpenChangeEvent) => void) | null;
    }
): ReactNode {
    return null;
}

function CustomComponent6(
    props: {
        foo: string;
        onClick: ((event: OnRequestOpenChangeEvent) => void) | undefined;
    }
): ReactNode {
    return null;
}

function CustomComponent7(
    props: {
        onClick: ((event: never) => void) | null | undefined;
    }
): ReactNode {
    return null;
}

function CustomComponent8(
    props: {
        onClick?: ((event: never) => void) | null | undefined;
    }
): ReactNode {
    return null;
}

function CustomComponent9(
    props: {
        foo: string;
        onClick: (event: string) => void;
    }
): ReactNode {
    return null;
}

function CustomComponent10(
    props: {
        foo: string;
        onClick?: MouseEventHandler | undefined;
    }
): ReactNode {
    return null;
}

function CustomComponent11(
    props: {
        foo?: string;
        onClick?: (event: Event) => void;
    }
): ReactNode {
    return null;
}

function CustomComponent12(
    props: {
        foo?: string;
        onClick?: (event: SyntheticEvent) => void;
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
                as="button"
                type="submit"
                disabled
            />

            <DropdownToggle
                as="button"
                // @ts-expect-error -- `href` is not a valid button prop
                href="#"
            />

            <DropdownToggle
                as="input"
                value="test"
                onChange={() => console.log("Input changed")}
            />

            <DropdownToggle
                as="input"
                // @ts-expect-error -- `href` is not a valid input prop
                href="#"
            />

            <DropdownToggle
                as="textarea"
                rows={2}
                defaultValue="hello"
            />

            <DropdownToggle
                as="textarea"
                // @ts-expect-error -- `type` is not a valid textarea prop
                type="button"
            />

            <DropdownToggle
                as="textarea"
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

            {/* @ts-expect-error -- Missing required custom prop `foo` */}
            <DropdownToggle
                as={CustomComponent}
            />

            <DropdownToggle
                as={CustomComponent2}
                onClick={() => console.log("Custom component toggle clicked")}
            />

            <DropdownToggle
                as={CustomComponent2}
            />

            <DropdownToggle
                as={CustomComponent3}
                onClick={() => console.log("Custom component toggle clicked")}
            />

            <DropdownToggle
                as={CustomComponent3}
                bar={123}
            />

            <DropdownToggle
                as={CustomComponent4}
                foo="test"
                bar={123}
                onClick={() => console.log("Custom component toggle clicked")}
            />

            <DropdownToggle
                as={CustomComponent4}
                foo="test"
                bar={123}
            />

            <DropdownToggle
                as={CustomComponent5}
                foo="test"
                onClick={() => console.log("Custom component toggle clicked")}
            />

            <DropdownToggle
                as={CustomComponent5}
                foo="test"
            />

            <DropdownToggle
                as={CustomComponent6}
                foo="test"
                onClick={() => console.log("Custom component toggle clicked")}
            />

            <DropdownToggle
                as={CustomComponent6}
                foo="test"
            />

            <DropdownToggle
                as={CustomComponent7}
                onClick={() => console.log("Custom component toggle clicked")}
            />

            <DropdownToggle
                as={CustomComponent7}
            />

            <DropdownToggle
                // @ts-expect-error -- Invalid `as` component with incompatible
                // `onClick` event type
                as={CustomComponent9}
                foo="test"
                onClick={() => console.log("Custom component toggle clicked")}
            />

            <DropdownToggle
                // @ts-expect-error -- Invalid `as` component with incompatible
                // `onClick` event type
                as={CustomComponent9}
                foo="test"
            />

            <DropdownToggle
                as={CustomComponent10}
                foo="test"
            />

            <DropdownToggle
                as={CustomComponent11}
                foo="test"
            />

            <DropdownToggle
                as={CustomComponent11}
            />

            <DropdownToggle
                as={CustomComponent12}
                foo="test"
            />

            <DropdownToggle
                as={CustomComponent12}
            />

            <DropdownToggle
                // @ts-expect-error -- Invalid `as` component that does not
                // accept required `onClick`
                as={InvalidCustomComponent}
                bar="test"
            />
        </>
    );

}
/* eslint-enable */
