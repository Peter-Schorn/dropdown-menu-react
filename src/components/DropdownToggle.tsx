import {
    type JSX,
    type ReactNode,
    type PropsWithChildren,
    type ComponentPropsWithRef,
    type Ref,
    type ElementType,
    type JSXElementConstructor,
    type MouseEventHandler,
    type SyntheticEvent,
    useContext,
    useCallback,
} from "react";

import type {
    RequestOpenChangeReasonInternal,
    RequestOpenChangeEvent
} from "../components/Dropdown";

import {
    DropdownToggleContext
} from "../model/context/DropdownToggleContext";

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
 * Extracts the underlying Ref instance type from a component's props. If the
 * component does not have a ref, the type will be `never`.
 */
type RefInstance<Props> =
  Props extends { ref?: Ref<infer I> } ? I : never;

type DropdownToggleAsValidation<T extends ElementType> =
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
                        ? RefInstance<Props> extends HTMLElement
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
        as?: DropdownToggleAsValidation<T>;
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
 * accept an `onClick` prop that can receive the toggle's click handler, which
 * has the signature `(event: OnRequestOpenChangeEvent) => void`. See
 * {@link DropdownToggleAsRequiredProps}.
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
    } = useContext(DropdownToggleContext);

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

    const Component = (as ?? "button") as ElementType;

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
            // these should overwrite any user-provided props since they are
            // required for the toggle to function correctly
            ref={setRef}
            onClick={handleClick}
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
        onClick: (event: RequestOpenChangeEvent) => void;
        ref: Ref<HTMLElement | null>;
    }
): ReactNode {
    return null;
}

function CustomComponent2(
    props: {
        onClick?: (event: RequestOpenChangeEvent) => void;
        ref?: Ref<HTMLButtonElement>;
    }
): ReactNode {
    return null;
}

function CustomComponent3(
    props: {
        onClick: (event: RequestOpenChangeEvent) => void | undefined | null;
        ref?: Ref<HTMLElement>;
        bar?: number;
    }
): ReactNode {
    return null;
}


function CustomComponent4(
    props: {
        foo: string;
        bar: number;
        onClick: (event: RequestOpenChangeEvent) => void;
        ref: Ref<HTMLDivElement>;
    }
): ReactNode {
    return null;
}

function CustomComponent5(
    props: {
        foo: string;
        onClick: ((event: RequestOpenChangeEvent) => void) | null;
        ref: (element: HTMLElement | null) => void;
    }
): ReactNode {
    return null;
}

function CustomComponent6(
    props: {
        foo: string;
        onClick: ((event: RequestOpenChangeEvent) => void) | undefined;
        ref?: (element: HTMLElement | null) => void;
    }
): ReactNode {
    return null;
}

function CustomComponent7(
    props: {
        onClick: ((event: never) => void) | null | undefined;
        ref?: (element: HTMLButtonElement | null) => void;
    }
): ReactNode {
    return null;
}

function CustomComponent8(
    props: {
        onClick?: ((event: never) => void) | null | undefined;
        ref?: (element: never) => void;
    }
): ReactNode {
    return null;
}

function CustomComponent9(
    props: {
        foo: string;
        onClick: (event: string) => void;
        ref: Ref<HTMLButtonElement>;
    }
): ReactNode {
    return null;
}

function CustomComponent10(
    props: {
        foo: string;
        onClick?: MouseEventHandler | undefined;
        ref?: Ref<HTMLElement> | undefined;
    }
): ReactNode {
    return null;
}

function CustomComponent11(
    props: {
        foo?: string;
        onClick?: (event: Event) => void;
        ref: Ref<Node>;
    }
): ReactNode {
    return null;
}

function CustomComponent12(
    props: {
        foo?: string;
        onClick?: (event: SyntheticEvent) => void;
        ref: (element: HTMLButtonElement) => void;
    }
): ReactNode {
    return null;
}

function CustomComponent13(
    props: {
        foo?: string;
        onClick?: (event: SyntheticEvent) => void;
        // invalid ref type
        ref: Ref<number>;
    }
): ReactNode {
    return null;
}

function CustomComponent14(
    props: {
        foo?: string;
        onClick?: (event: SyntheticEvent) => void;
        // invalid ref type
        ref: (element: Node) => void;
    }
): ReactNode {
    return null;
}

function CustomComponent15(
    props: {
        foo?: string;
        onClick?: (event: SyntheticEvent) => void;
        // missing ref
    }
): ReactNode {
    return null;
}

function CustomComponent16(
    props: {
        bar: string;
        // missing required onClick prop
        ref: Ref<HTMLElement>;
    }
): ReactNode {
    return null;
}

function CustomComponent17(
    props: {
        bar: string;
        // missing required onClick prop
        // missing ref
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

            {/* @ts-expect-error -- Missing required custom props `foo` */}
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
                // @ts-expect-error -- Invalid `as` component with incompatible
                // `ref` type: `Ref<Node>` is not compatible with
                // `Ref<HTMLElement>` because `Node` is not a subtype of
                // `HTMLElement`
                as={CustomComponent11}
                foo="test"
            />

            <DropdownToggle
                // @ts-expect-error -- Invalid `as` component with incompatible
                // `ref` type: `Ref<Node>` is not compatible with
                // `Ref<HTMLElement>` because `Node` is not a subtype of
                // `HTMLElement`
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
                // @ts-expect-error -- Invalid `as` component with incompatible
                // `ref` type: `Ref<number>` is not compatible with
                // `Ref<HTMLElement>` because `number` is not a subtype of
                // `HTMLElement`
                as={CustomComponent13}
                foo="test"
            />

             <DropdownToggle
                // @ts-expect-error -- Invalid `as` component with incompatible
                // `ref` type: `Ref<number>` is not compatible with
                // `Ref<HTMLElement>` because `Node` is not a subtype of
                // `HTMLElement`
                as={CustomComponent14}
                foo="test"
            />

            <DropdownToggle
                // @ts-expect-error -- Invalid `as` component: missing ref
                as={CustomComponent15}
            />

            <DropdownToggle
                // @ts-expect-error -- Invalid `as` component that does not
                // accept required `onClick`
                as={CustomComponent16}
                bar="test"
            />

            <DropdownToggle
                // @ts-expect-error -- Invalid `as` component: missing ref and
                // `onClick`
                as={CustomComponent17}
                bar="test"
            />
        </>
    );

}
/* eslint-enable */
