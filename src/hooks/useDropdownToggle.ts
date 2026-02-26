import {
    useContext,
    useMemo
} from "react";

import {
    type DropdownToggleContextType,
    DropdownToggleContext
} from "../model/context/DropdownToggleContext";

import {
    type DropdownOpenContextType,
    DropdownOpenContext
} from "../model/context/DropdownOpenContext";

/**
 * The result type of the {@link useDropdownToggle} hook, which provides the
 * necessary state and functions for a custom dropdown toggle component to
 * function correctly within the dropdown menu system.
 *
 * @public
 */
export type UseDropdownToggleResult = {
    isOpen: DropdownOpenContextType["isOpen"];
    requestOpenChange: DropdownToggleContextType["requestOpenChange"];
    dropdownToggleRef: DropdownToggleContextType["dropdownToggleRef"];
};

/**
 * A hook that provides the necessary state and functions for a custom dropdown
 * toggle component to function correctly within the dropdown menu system. It
 * provides the current open state of the dropdown menu, a function to request
 * changes to that state, and a ref that should be attached to the underlying
 * DOM element rendered by the dropdown toggle.
 *
 * If you are using the default {@link DropdownToggle} component, you do not
 * need to use this hook directly. However, if you are creating a custom
 * dropdown toggle component, you can use this hook to coordinate with the
 * dropdown menu. It must be used within a component that is a descendant of a
 * {@link Dropdown} component, which provides the necessary context providers
 * for this hook to function.
 *
 * Internally, it depends on the {@link DropdownOpenContext} and
 * {@link DropdownToggleContext} to get the necessary state and functions.
 * Therefore, it must be used within a component that is a descendant of a
 * {@link Dropdown} component, which provides these contexts.
 *
 * {@link DropdownOpenContext} provides a single reactive `isOpen` value that
 * indicates whether the dropdown menu is currently open or closed. This value
 * will update whenever the open state of the dropdown menu changes, allowing
 * your custom toggle component to react to these changes and render
 * accordingly.
 *
 * {@link DropdownToggleContext} provides a `requestOpenChange` function that
 * can be called to request changes to the open state of the dropdown menu, and
 * a `dropdownToggleRef` that should be attached to the underlying DOM element
 * rendered by the dropdown toggle. The value provided by this context has a
 * stable identity and will never change between renders. Therefore, if you only
 * need access to these props, you can use the `useContext` hook directly with
 * `DropdownToggleContext` instead of using this hook. This prevents your
 * component from re-rendering when the `isOpen` value changes if you do not
 * need to react to those changes.
 *
 * @public
 */
export function useDropdownToggle(): UseDropdownToggleResult {

    const {
        isOpen
    } = useContext(DropdownOpenContext);

    const {
        requestOpenChange,
        dropdownToggleRef
    } = useContext(DropdownToggleContext);

    return useMemo(
        (): UseDropdownToggleResult => ({
            isOpen,
            requestOpenChange,
            dropdownToggleRef
        }),
        [
            isOpen,
            requestOpenChange,
            dropdownToggleRef
        ]
    );

}
