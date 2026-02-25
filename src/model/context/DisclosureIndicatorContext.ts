import {
    createContext,
} from "react";

/**
 * The context type for the disclosure indicator of a dropdown item, which
 * provides information about whether the submenu associated with the dropdown
 * item is currently open or closed. This context is used by the default
 * {@link DisclosureIndicator} component to determine the color of the
 * disclosure indicator icon, but it can also be used by custom disclosure
 * indicator components.
 *
 * @public
 */
export type DisclosureIndicatorContextType = Readonly<{
    /**
     * A boolean value indicating whether the submenu associated with the
     * dropdown item is currently open or closed.
     */
    submenuIsOpen: boolean;
}>;

/**
 * The context for the disclosure indicator of a dropdown item, which provides
 * information about whether the submenu associated with the dropdown item is
 * currently open or closed. This context is used by the default
 * {@link DisclosureIndicator} component to determine the color of the
 * disclosure indicator icon, but it can also be used by custom disclosure
 * indicator components.
 *
 * @public
 */
export const DisclosureIndicatorContext =
    createContext<DisclosureIndicatorContextType>({
        get submenuIsOpen(): boolean {
            // eslint-disable-next-line no-console
            console.warn(
                "DisclosureIndicatorContext.submenuIsOpen was accessed, but " +
                "no provider is set up. This component must be used as a " +
                "child of a <DropdownItemLabel> component that is a child of " +
                "a <DropdownItem> component."
            );
            return false;
        }
    });


DisclosureIndicatorContext.displayName = "DisclosureIndicatorContext";
