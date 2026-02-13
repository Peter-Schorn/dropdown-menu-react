import { useContext } from "react";

import { useSlot } from "../hooks/useSlot";

import {
    type DropdownItemSlotsContextType,
    DropdownItemSlotsContext
} from "../model/context/DropdownItemSlotsContext";

import { dropdownItemSlotProviderLogger as logger } from "../utils/loggers";

export type DropdownItemSlotsSetter<Func extends (value: never) => void> =
    Parameters<Func>[0];

export type DropdownItemSlotsSetters = {
    [K in keyof DropdownItemSlotsContextType]?:
    DropdownItemSlotsSetter<DropdownItemSlotsContextType[K]>;
};

export function useDropdownItemSlotsContext(
    setters: DropdownItemSlotsSetters
): void {

    const context = useContext(DropdownItemSlotsContext);

    if (!context) {
        throw new Error(
            "DropdownItemSlotsContext must be used with a provider"
        );
    }

    logger.debug(
        "useDropdownItemSlotsContext: render: context:\n",
        context
    );

    useSlot(
        setters.setLabel ? {
            setter: context.setLabel,
            value: setters.setLabel
        } : null,

        setters.setSubmenu ? {
            setter: context.setSubmenu,
            value: setters.setSubmenu
        } : null,

        setters.setSubmenuID ? {
            setter: context.setSubmenuID,
            value: setters.setSubmenuID
        } : null
    );

}
