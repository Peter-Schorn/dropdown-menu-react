import log from "loglevel";

import {
    setLoggers
} from "./utils/loggers";

// MARK: Log Levels:
// 0: trace
// 1: debug
// 2: info
// 3: warn
// 4: error
// 5: silent

/**
 * Configures the dropdown menu loggers to use loggers from the `loglevel`
 * module.
 *
 * After calling this function, if you wish to further customize the loggers via
 * `setLoggers`, you can use the `Logger` type from the `loglevel` module as the
 * type parameter for `setLoggers` to get proper typing. For example:
 *
 * ```ts
 * setLoggers<Logger>((loggers) => {
 *     // customize loggers...
 *     return loggers;
 * });
 * ```
 */
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
