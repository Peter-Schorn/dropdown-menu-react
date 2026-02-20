/**
 * The basic interface for loggers used in this library.
 *
 * @public
 */
export type DropdownMenuLogger = {
    trace(...args: unknown[]): void;
    debug(...args: unknown[]): void;
    info(...args: unknown[]): void;
    warn(...args: unknown[]): void;
    error(...args: unknown[]): void;
};

/**
 * An object containing all loggers used in this library. This can be used to
 * set all loggers at once via the `setLoggers` function.
 *
 * @public
 *
 * @typeParam T - The logger type used for each logger.
 */
export type DropdownMenuLoggers<T extends DropdownMenuLogger = DropdownMenuLogger> = {
    dropdownMenuLogger: T;
    dropdownItemLogger: T;
    dropdownMenuCoreLogger: T;
    dropdownMenuScrollArrowLogger: T;
    customScrollbarLogger: T;
    dropdownItemLabelLogger: T;
    dropdownItemSubmenuLogger: T;
    disclosureIndicatorLogger: T;
    dropdownItemSlotProviderLogger: T;
};

function noop(): void {
    // no operation
}

/**
 * A no-op logger that can be used to disable logging. This is the default
 * logger for all loggers in this library.
 *
 * @public
 */
export const noopLogger: DropdownMenuLogger = new Proxy({} as DropdownMenuLogger, {
    get(): () => void {
        return noop;
    }
});

// MARK: Loggers

export let dropdownMenuLogger: DropdownMenuLogger = noopLogger;
export let dropdownItemLogger: DropdownMenuLogger = noopLogger;
export let dropdownMenuCoreLogger: DropdownMenuLogger = noopLogger;
export let dropdownMenuScrollArrowLogger: DropdownMenuLogger = noopLogger;
export let customScrollbarLogger: DropdownMenuLogger = noopLogger;
export let dropdownItemLabelLogger: DropdownMenuLogger = noopLogger;
export let dropdownItemSubmenuLogger: DropdownMenuLogger = noopLogger;
export let disclosureIndicatorLogger: DropdownMenuLogger = noopLogger;
export let dropdownItemSlotProviderLogger: DropdownMenuLogger = noopLogger;

/**
 * The type for the `setLoggers` function, which can be used to set the loggers
 * for this library. This can be either an object containing the loggers to set,
 * or a function that takes the current loggers and returns such an object or
 * void to indicate no reassignments to the loggers. The latter form allows for
 * in-place mutation of the loggers.
 *
 * @public
 *
 * @typeParam T - The logger type used for each logger.
 */
export type SetLoggers<T extends DropdownMenuLogger = DropdownMenuLogger> =
    | Partial<DropdownMenuLoggers<T>>
    | ((loggers: DropdownMenuLoggers<T>) => Partial<DropdownMenuLoggers<T>> | void);

/**
 * Sets the loggers for this library.
 *
 * @public
 *
 * @typeParam T - The logger type used for each logger.
 * @param loggers - An object containing the loggers to set, or a function that
 * takes the current loggers and returns such an object or void to indicate no
 * reassignments to the loggers. The latter form allows for in-place mutation of
 * the loggers.
 */
export function setLoggers<
    T extends DropdownMenuLogger = DropdownMenuLogger
>(
    loggers: SetLoggers<T>
): void {

    const newLoggers = typeof loggers === "function"
        ? loggers({
            dropdownMenuLogger: dropdownMenuLogger as T,
            dropdownItemLogger: dropdownItemLogger as T,
            dropdownMenuCoreLogger: dropdownMenuCoreLogger as T,
            dropdownMenuScrollArrowLogger: dropdownMenuScrollArrowLogger as T,
            customScrollbarLogger: customScrollbarLogger as T,
            dropdownItemLabelLogger: dropdownItemLabelLogger as T,
            dropdownItemSubmenuLogger: dropdownItemSubmenuLogger as T,
            disclosureIndicatorLogger: disclosureIndicatorLogger as T,
            dropdownItemSlotProviderLogger: dropdownItemSlotProviderLogger as T
        })
        : loggers;

    if (!newLoggers || typeof newLoggers !== "object") {
        return;
    }

    if (newLoggers.dropdownMenuLogger) {
        dropdownMenuLogger = newLoggers.dropdownMenuLogger;
    }
    if (newLoggers.dropdownItemLogger) {
        dropdownItemLogger = newLoggers.dropdownItemLogger;
    }
    if (newLoggers.dropdownMenuCoreLogger) {
        dropdownMenuCoreLogger = newLoggers.dropdownMenuCoreLogger;
    }
    if (newLoggers.dropdownMenuScrollArrowLogger) {
        dropdownMenuScrollArrowLogger =
            newLoggers.dropdownMenuScrollArrowLogger;
    }
    if (newLoggers.customScrollbarLogger) {
        customScrollbarLogger = newLoggers.customScrollbarLogger;
    }
    if (newLoggers.dropdownItemLabelLogger) {
        dropdownItemLabelLogger = newLoggers.dropdownItemLabelLogger;
    }
    if (newLoggers.dropdownItemSubmenuLogger) {
        dropdownItemSubmenuLogger = newLoggers.dropdownItemSubmenuLogger;
    }
    if (newLoggers.disclosureIndicatorLogger) {
        disclosureIndicatorLogger = newLoggers.disclosureIndicatorLogger;
    }
    if (newLoggers.dropdownItemSlotProviderLogger) {
        dropdownItemSlotProviderLogger = newLoggers.dropdownItemSlotProviderLogger;
    }
}

/**
 * Gets the log message prefix for a logger based on its name. The prefix is the
 * logger name without the "Logger" suffix and with the first letter
 * capitalized. For example, for a logger named "dropdownMenuLogger", the prefix
 * would be "DropdownMenu". If `wrapInBrackets` is `true`, the prefix is wrapped
 * in square brackets. For example, "[DropdownMenu]".
 *
 * @param loggerName - The name of the logger.
 * @param wrapInBrackets - Whether to wrap the prefix in square brackets.
 * @returns The log message prefix for the logger.
 *
 */
export function getLoggerPrefix(
    loggerName: string,
    wrapInBrackets: boolean
): string {

    const regex = /(.+)Logger/g;

    const prefix = loggerName.replace(regex, (_match, group1: string) => {
        // group1 is the first capturing group, which is the logger name without
        // the "Logger" suffix
        const normalizedGroup = group1.length > 0
            ? group1[0]!.toUpperCase() + group1.slice(1)
            : group1;
        return wrapInBrackets
            ? `[${normalizedGroup}]`
            : normalizedGroup;
    });

    return prefix;
}

/**
 * Creates a logger that logs to the browser console. The logger prefixes each
 * log message with the logger name in square brackets.
 *
 * @public
 *
 * @param name - The name of the logger.
 * @returns A logger that logs to the browser console.
 */
function makeConsoleLogger(
    name: string
): DropdownMenuLogger {

    const prefix = getLoggerPrefix(name, true);

    /* eslint-disable no-console */
    return {
        trace: console.trace.bind(console, prefix),
        debug: console.debug.bind(console, prefix),
        info: console.info.bind(console, prefix),
        warn: console.warn.bind(console, prefix),
        error: console.error.bind(console, prefix),
    };
    /* eslint-enable */
}

/**
 * A convenience function that configures all loggers to use the browser
 * console.
 *
 * Each log message is prefixed with the logger name in square brackets.
 *
 * @public
 */
export function setConsoleLoggers(): void {
    setLoggers((loggers) => {

        for (
            const name of Object.keys(loggers) as (keyof DropdownMenuLoggers)[]
        ) {
            loggers[name] = makeConsoleLogger(name);
        }

        return loggers;

    });
}

/**
 * A convenience function that disables all logging by setting all loggers to
 * the no-op logger.
 *
 * @public
 */
export function disableLoggers(): void {
    setLoggers(() => {
        return {
            dropdownMenuLogger: noopLogger,
            dropdownItemLogger: noopLogger,
            dropdownMenuCoreLogger: noopLogger,
            dropdownMenuScrollArrowLogger: noopLogger,
            customScrollbarLogger: noopLogger,
            dropdownItemLabelLogger: noopLogger,
            dropdownItemSubmenuLogger: noopLogger,
            disclosureIndicatorLogger: noopLogger,
            dropdownItemSlotProviderLogger: noopLogger
        };
    });
}
