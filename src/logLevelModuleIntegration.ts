import log, {
    type Logger
} from "loglevel";

import {
    type DropdownMenuLoggers,
    setLoggers
} from "./utils/loggers";

/**
 * A type representing the loggers for the dropdown menu components where each
 * logger is of type `Logger` from the `loglevel` module. Only use if
 * `enableLogLevelModuleLogging` has been called or if you have otherwise
 * assigned loggers from the `loglevel` module to each logger.
 */
export type DropdownMenuLogLevelModuleLoggers = {
    // each property K in DropdownMenuLoggers is mapped to Logger if `Logger` is
    // assignable to DropdownMenuLoggers[K]; otherwise, it is kept as is.
    [K in keyof DropdownMenuLoggers]: Logger extends DropdownMenuLoggers[K]
    ? Logger
    : DropdownMenuLoggers[K];
};

export function enableLogLevelModuleLogging(): void {

    try {

        setLoggers({
            dropdownMenuLogger: log.getLogger(
                "DropdownMenu"
            ),
            dropdownItemLogger: log.getLogger(
                "DropdownItem"
            ),
            dropdownMenuCoreLogger: log.getLogger(
                "DropdownMenuCore"
            ),
            dropdownMenuScrollArrowLogger: log.getLogger(
                "DropdownMenuScrollArrow"
            ),
            customScrollbarLogger: log.getLogger(
                "CustomScrollbar"
            )
        });

    } catch (error) {
        // eslint-disable-next-line no-console
        console.warn(
            "dropdown-menu: enableLogLevelModuleLogging: error:",
            error
        );
        return;
    }

}
