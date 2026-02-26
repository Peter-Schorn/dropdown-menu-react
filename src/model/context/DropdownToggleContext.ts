import {
    type RefObject,
    createContext
} from "react";

import type {
    RequestOpenChangeOptions
} from "../../components/Dropdown";

/**
 * The context type for the dropdown toggle component, which provides a function
 * to request changes to that state. It also provides a ref that should be
 * attached to the underlying DOM element rendered by the dropdown toggle, which
 * allows the dropdown menu to position itself correctly relative to the toggle.
 *
 * If you are using the default {@link DropdownToggle} component, you do not
 * need to interact with this context directly. However, if you are creating a
 * custom dropdown toggle component, you can use this context coordinate with
 * the dropdown menu.
 *
 * @public
 */
export type DropdownToggleContextType = Readonly<{
    /**
     * Requests a change to the open state of the dropdown menu.
     *
     * @param options - An object containing options for the open change
     * request:
     * - `open`: A boolean indicating whether the dropdown menu should be opened
     *   or closed, or a function that receives the current open state and
     *   returns the new open state.
     * - `reason`: A string indicating the reason for the open change request.
     *   This can be used by the consuming component to determine how to handle
     *   the open change request.
     * - `event`: The event that triggered the open change request, if
     *   applicable.
     */
    requestOpenChange: (
        options: RequestOpenChangeOptions
    ) => void;

    /**
     * A ref object that should be attached to the underlying DOM element that
     * the dropdown toggle renders. This allows the dropdown menu to position
     * itself correctly relative to the toggle.
     */
    dropdownToggleRef: RefObject<HTMLElement | null>;
}>;

export const dropdownToggleContextDefaultValue: DropdownToggleContextType = {
    requestOpenChange: () => {
        // eslint-disable-next-line no-console
        console.warn(
            "DropdownToggleContext.requestOpenChange called, but no provider " +
            "is set up. This component must be used as a child of a " +
            "<Dropdown> component."
        );
    },
    get dropdownToggleRef(): RefObject<HTMLElement | null> {
        // eslint-disable-next-line no-console
        console.warn(
            "DropdownToggleContext.dropdownToggleRef was accessed, but no " +
            "provider is set up. This component must be used as a child of a " +
            "<Dropdown> component."
        );
        return { current: null };
    }
};

/**
 * The context for the dropdown toggle component, which provides a function to
 * request changes to that state. It also provides a ref that should be attached
 * to the underlying DOM element rendered by the dropdown toggle, which allows
 * the dropdown menu to position itself correctly relative to the toggle.
 *
 * If you are using the default {@link DropdownToggle} component, you do not
 * need to interact with this context directly. However, if you are creating a
 * custom dropdown toggle component, you can use this context coordinate with
 * the dropdown menu.
 *
 * The value received from this context has a stable identity and will never
 * change between renders.
 *
 * @public
 */
export const DropdownToggleContext = createContext<DropdownToggleContextType>(
    dropdownToggleContextDefaultValue
);

DropdownToggleContext.displayName = "DropdownToggleContext";
