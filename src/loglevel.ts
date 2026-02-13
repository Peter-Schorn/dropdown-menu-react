import log from "loglevel";

import {
    setLoggers,
    getLoggerPrefix,
    type DropdownMenuLoggers
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

        setLoggers((loggers) => {

            for (
                const name of Object.keys(loggers) as
                (keyof DropdownMenuLoggers)[]
            ) {
                const prefix = getLoggerPrefix(name, false);

                loggers[name] = log.getLogger(prefix);

            }

            return loggers;

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
