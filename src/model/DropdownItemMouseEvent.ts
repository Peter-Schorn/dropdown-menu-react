/**
 * @internal
 */
export type _DropdownItemMouseEventImpl = MouseEvent & {

    /**
     * If this property is `true`, then the default behavior of closing the
     * entire dropdown menu when a leaf item is clicked will be prevented.
     *
     * This property is set to `true` when the
     * {@link _DropdownItemMouseEventImpl.preventCloseDropdownMenu | preventCloseDropdownMenu}
     * method of this event object is called in the onClick handler of a leaf
     * DropdownItem.
     */
    isPreventCloseDropdownMenu: boolean;

    /**
     * If this property is `true`, then the default behavior of closing all
     * non-parent submenus when a leaf item is clicked will be prevented.
     *
     * This property is set to `true` when the
     * {@link _DropdownItemMouseEventImpl.preventCloseNonParentSubmenusOnClickLeafItem | preventCloseNonParentSubmenusOnClickLeafItem}
     * method of this event object is called in the onClick handler of a leaf
     * DropdownItem.
     */
    isPreventCloseNonParentSubmenusOnClickLeafItem: boolean;

    /**
     * If this property is `true`, then the default behavior of toggling the
     * submenu of a non-leaf item when it is clicked will be prevented.
     *
     * This property is set to `true` when the
     * {@link _DropdownItemMouseEventImpl.preventToggleSubmenu | preventToggleSubmenu}
     * method of this event object is called in the onClick handler of a
     * non-leaf DropdownItem.
     *
     * This property has no effect if called in the onClick handler of a leaf
     * DropdownItem.
     */
    isPreventToggleSubmenu: boolean;

    /**
     * Calling this method in an onClick handler of a DropdownItem will prevent
     * the default behavior of closing the entire dropdown menu when the item is
     * clicked.
     *
     * This method has no effect if called in the onClick handler of a non-leaf
     * DropdownItem.
     */
    preventCloseDropdownMenu(): void;

    /**
     * Calling this method in an onClick handler of a leaf DropdownItem will
     * prevent the default behavior of closing all non-parent submenus when the
     * item is clicked.
     *
     * This method has no effect if called in the onClick handler of a non-leaf
     * DropdownItem.
     */
    preventCloseNonParentSubmenusOnClickLeafItem(): void;

    /**
     * Calling this method in an onClick handler of a non-leaf DropdownItem will
     * prevent the default behavior of toggling the submenu of the item when it
     * is clicked.
     *
     * This method has no effect if called in the onClick handler of a leaf
     * DropdownItem.
     */
    preventToggleSubmenu(): void;
};

/**
 * The event object passed to the `onClick` handler of a `DropdownItem`. It
 * extends the native `MouseEvent` with additional methods for preventing the
 * default click behavior of closing the dropdown menu or closing non-parent
 * submenus when a leaf item is clicked.
 *
 * @public
 */
export type DropdownItemMouseEvent = Readonly<_DropdownItemMouseEventImpl>;

export function createDropdownItemMouseEvent(
    event: MouseEvent
): DropdownItemMouseEvent {

    const dropdownItemMouseEvent = event as _DropdownItemMouseEventImpl;
    dropdownItemMouseEvent.isPreventCloseDropdownMenu = false;
    dropdownItemMouseEvent.isPreventCloseNonParentSubmenusOnClickLeafItem = false;
    dropdownItemMouseEvent.isPreventToggleSubmenu = false;

    dropdownItemMouseEvent.preventCloseDropdownMenu = (): void => {
        dropdownItemMouseEvent.isPreventCloseDropdownMenu = true;
    };

    dropdownItemMouseEvent.preventCloseNonParentSubmenusOnClickLeafItem = (): void => {
        dropdownItemMouseEvent.isPreventCloseNonParentSubmenusOnClickLeafItem = true;
    };

    dropdownItemMouseEvent.preventToggleSubmenu = (): void => {
        dropdownItemMouseEvent.isPreventToggleSubmenu = true;
    };

    return dropdownItemMouseEvent;
}
