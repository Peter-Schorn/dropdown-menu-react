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
export type DisclosureIndicatorContextType = {
    /**
     * A boolean value indicating whether the submenu associated with the
     * dropdown item is currently open or closed.
     */
    submenuIsOpen: boolean;
};

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
        submenuIsOpen: false
    });
