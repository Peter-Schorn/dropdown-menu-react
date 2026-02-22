import {
    type ReactNode,
    type PropsWithChildren,
    useMemo,
    useContext,
    useRef,
    memo,
    useEffect
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

    const isSubmenu = useStore(
        dropdownSubmenuStoreContext,
        (state) => state.isSubmenu
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
        `submenuID: "${submenuID}"; submenuIsOpen: ${submenuIsOpen}; ` +
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

    return (
        <div
            className="bd-dropdown-item"
            ref={dropdownItemRef}
            data-has-submenu={isSubmenu}
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
                    data-has-submenu={isSubmenu}
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
