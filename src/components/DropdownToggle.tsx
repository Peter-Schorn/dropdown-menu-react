import {
    type JSX,
    type PropsWithChildren,
    type ComponentPropsWithRef
} from "react";

export type DropdownToggleProps =
    PropsWithChildren &
    ComponentPropsWithRef<"button">;

// TODO: Allow specifying a different element type for the toggle, e.g. an
//  anchor tag, by adding a polymorphic `as` prop

/**
 * A dropdown toggle component that serves as the trigger for opening and
 * closing the dropdown menu. It should be used as a child of the `Dropdown`
 * component.
 */
export function DropdownToggle(
    {
        type = "button",
        className = "bd-dropdown-toggle",
        children,
        ...rest
    }: DropdownToggleProps
): JSX.Element {

    return (
        <button
            type={type}
            className={className}
            {...rest}
        >
            {children}
        </button>
    );

}

DropdownToggle.displayName = "DropdownToggle";
