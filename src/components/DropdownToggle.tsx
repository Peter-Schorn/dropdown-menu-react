import {
    type JSX,
    type ReactNode,
    type ComponentPropsWithRef,
    type ElementType,
    type MouseEvent as ReactMouseEvent,
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

// type DropdownToggleRequiredProps = {
//     onClick: (event: ReactMouseEvent<Element, MouseEvent>) => void;
// }

/**
 * Props for the {@link DropdownToggle} component.
 *
 * @public
 */
export type DropdownToggleProps<T extends ElementType = "button"> = {
    /**
     * The element type to render as. Defaults to "button".
     */
    as?: T;
} & Omit<ComponentPropsWithRef<T>, "as">;

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
): JSX.Element {

    const Component = as ?? "button";

    const {
        requestOpenChange
    } = useContext(DropdownToggleContext);

    const handleClick = useCallback((
        event: ReactMouseEvent<Element, MouseEvent>
    ): void => {

        // first call the user's onClick handler, if provided, to allow them to
        // call `event.preventDefault()` to prevent the default toggle behavior
        (onClick as ((e: ReactMouseEvent<Element, MouseEvent>) => void))?.(
            event
        );

        // if the default behavior was prevented, do not toggle the open state
        // of the dropdown menu
        if (event.defaultPrevented) {
            return;
        }

        // this component only uses the internal reasons, but a custom component
        // could use any reason it wants
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

    return (
        <Component
            {...(isButton ? { type: "button" } : {})}
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
    a: string;
};

function CustomComponent(
    props: CustomComponentProps
): ReactNode {
    return null;
}

function TestDropdownToggle(): JSX.Element {

    return (
        <>
            <DropdownToggle
                onClick={() => console.log("Toggle clicked")}
            />
            <DropdownToggle
                as="a"
                href="#"
                onClick={() => console.log("Link toggle clicked")}
            />
            <DropdownToggle
                as={CustomComponent}
                a="test"
                // onClick={() => console.log("Custom component toggle clicked")}
            />
        </>
    );

}
/* eslint-enable */
