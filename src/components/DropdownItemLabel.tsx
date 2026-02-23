import {
    type ReactNode,
    type PropsWithChildren,
    useMemo,
    useContext,
    useRef,
    memo,
    useEffect,
    useLayoutEffect
} from "react";

import {
    useStore
} from "zustand";

import { useEffectEvent } from "../hooks/useEffectEvent";

import { useDebugConfig } from "../hooks/useDebugConfig";

import {
    DropdownItemContext
} from "../model/context/DropdownItemContext";

import {
    useDropdownMenuStoreContext
    // mockDropdownMenuStoreContextValue
} from "../model/store/DropdownMenuStore";

import {
    useDropdownSubmenuStoreContext
    // mockDropdownSubmenuStoreContextValue
} from "../model/store/DropdownSubmenuStore";

import {
    type DisclosureIndicatorContextType,
    DisclosureIndicatorContext
} from "../model/context/DisclosureIndicatorContext";

import { dropdownItemLabelLogger as logger } from "../utils/loggers";

/**
 * Props for the `DropdownItemLabel` component.
 *
 * @public
 */
export type DropdownItemLabelProps = PropsWithChildren;

/**
 * A dropdown item label component that is used to set the label of a dropdown
 * item when it is used as a child of a `DropdownItem`.
 *
 * @param props - An object containing:
 * - `children` - The content of the label, which can be any React node.
 *
 * @public
 */
export const DropdownItemLabel = memo(function DropdownItemLabelMemo(
    { children }: DropdownItemLabelProps
): ReactNode {

    const debugConfig = useDebugConfig();

    // MARK: DropdownItem Context
    const {
        dropdownItemRef
    } = useContext(DropdownItemContext);

    // MARK: Submenu Store
    const dropdownSubmenuStoreContext = useDropdownSubmenuStoreContext();

    const submenuID = useStore(
        dropdownSubmenuStoreContext,
        (state) => state.submenuID
    );

    // MARK: Menu Store
    const dropdownMenuStoreContext = useDropdownMenuStoreContext();

    const submenuIsOpen: boolean = useStore(
        dropdownMenuStoreContext,
        (state) => {
            return state.openMenuIDsPath.includes(submenuID);
        }
    );

    const dropdownItemLabelRef = useRef<HTMLDivElement>(null);
    const internalID = useRef(crypto.randomUUID());

    logger.debug(
        // eslint-disable-next-line react-hooks/refs
        `render: internalID: ${internalID.current}; ` +
        `submenuID: "${submenuID}"; ` +
        `submenuIsOpen: ${submenuIsOpen}; ` +
        "children:\n",
        children
    );

    const disclosureIndicatorContextValue = useMemo(
        (): DisclosureIndicatorContextType => ({
            submenuIsOpen
        }),
        [
            submenuIsOpen
        ]
    );

    const onCommit = useEffectEvent(() => {
        logger.debug(
            `commit: internalID: ${internalID.current}; ` +
            `submenuID: "${submenuID}"; submenuIsOpen: ${submenuIsOpen}`
        );
    });

    useEffect(() => {
        onCommit();
    });

    // MARK: useLayoutEffect: Imperatively subscribe to isSubmenu changes and
    //  set DOM data attributes on the dropdown item and label elements
    useLayoutEffect(() => {
        // we imperatively subscribe to changes to `isSubmenu` to avoid
        // triggering a re-render of the this component when `isSubmenu`
        // changes. The client could pass in arbitrarily complex and un-memoized
        // components as children of this component, and we want to avoid
        // unnecessary re-renders of those components when `isSubmenu` changes.

        function setHasSubmenuDataAttribute(
            isSubmenu: boolean
        ): void {
            const dropdownItem = dropdownItemRef.current;
            const dropdownItemLabel = dropdownItemLabelRef.current;

            if (!dropdownItem || !dropdownItemLabel) {
                logger.warn(
                    "DropdownItemLabel or DropdownItem ref is null; cannot " +
                    "set data-has-submenu attribute"
                );
                return;
            }

            const isSubmenuString = String(isSubmenu);
            dropdownItem.dataset.hasSubmenu = isSubmenuString;
            dropdownItemLabel.dataset.hasSubmenu = isSubmenuString;
        }

        const unsubscribe = dropdownSubmenuStoreContext.subscribe(
            (state) => state.isSubmenu,
            setHasSubmenuDataAttribute
        );

        setHasSubmenuDataAttribute(
            dropdownSubmenuStoreContext.getState().isSubmenu
        );

        return unsubscribe;
    }, [
        dropdownSubmenuStoreContext,
        dropdownItemRef
    ]);

    return (
        <div
            className="bd-dropdown-item"
            ref={dropdownItemRef}
            data-submenu-id={submenuID}
        //  `data-hover` and `data-secondary-focus` will be
        //  programmatically set
        >
            <DisclosureIndicatorContext.Provider
                value={disclosureIndicatorContextValue}
            >

                {/* TODO: hover and secondary focus are not set here
                    because we will remove this bd-dropdown-item-label
                    class */}
                <div
                    className="bd-dropdown-item-label"
                    ref={dropdownItemLabelRef}
                    // provided so that the client can customize styles
                    // based on these states
                    data-submenu-id={submenuID}
                >
                    {/* MARK: Label Content */}
                    {children}
                </div>
                {
                    debugConfig.showMenuIds &&
                    (
                        <div className="bd-dropdown-debug-id">
                            {submenuID}
                        </div>
                    )
                }
            </DisclosureIndicatorContext.Provider>
        </div>
    );

});

// use any to exclude from the generated .d.ts file
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
(DropdownItemLabel as any).displayName = "DropdownItemLabel";
