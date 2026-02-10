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
};

function noop(): void {
    // no operation
}

const noopLogger: DropdownMenuLogger = new Proxy({} as DropdownMenuLogger, {
    get(): () => void {
        return noop;
    }
});

export let dropdownMenuLogger: DropdownMenuLogger = noopLogger;
export let dropdownItemLogger: DropdownMenuLogger = noopLogger;
export let dropdownMenuCoreLogger: DropdownMenuLogger = noopLogger;
export let dropdownMenuScrollArrowLogger: DropdownMenuLogger = noopLogger;
export let customScrollbarLogger: DropdownMenuLogger = noopLogger;

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
            customScrollbarLogger: customScrollbarLogger as T
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

    const regex = /(.+)Logger/g;

    const prefix = name.replace(regex, (_match, group1: string) => {
        // group1 is the first capturing group, which is the logger name without
        // the "Logger" suffix
        const normalizedGroup = group1.length > 0
            ? group1[0]!.toUpperCase() + group1.slice(1)
            : group1;
        return `[${normalizedGroup}]`;
    });

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
