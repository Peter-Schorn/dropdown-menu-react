import {
    createContext
} from "react";

/**
 * The context for the open/closed state of the dropdown menu. It provides a
 * boolean `isOpen` that indicates whether the dropdown menu is currently open
 * or closed.
 *
 * If you are using the default {@link Dropdown} component, you do not need to
 * interact with this context directly. However, if you are creating a custom
 * dropdown component, you can use this context to determine the open/closed
 * state of the dropdown menu.
 *
 * @public
 */
export type DropdownOpenContextType = Readonly<{
    isOpen: boolean;
}>;

export const dropdownOpenContextDefaultValue: DropdownOpenContextType = {
    get isOpen(): boolean {
        // eslint-disable-next-line no-console
        console.warn(
            "DropdownOpenContext.isOpen was accessed, but no provider is set " +
            "up. This component must be used as a child of a <Dropdown> " +
            "component."
        );
        return false;
    }
};

/**
 * The context for the open/closed state of the dropdown menu. It provides a
 * boolean `isOpen` that indicates whether the dropdown menu is currently open
 * or closed.
 *
 * If you are using the default {@link Dropdown} component, you do not need to
 * interact with this context directly. However, if you are creating a custom
 * dropdown component, you can use this context to determine the open/closed
 * state of the dropdown menu.
 *
 * @public
 */
export const DropdownOpenContext = createContext<DropdownOpenContextType>(
    dropdownOpenContextDefaultValue
);

DropdownOpenContext.displayName = "DropdownOpenContext";
