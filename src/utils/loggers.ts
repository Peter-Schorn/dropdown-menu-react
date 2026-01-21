// MARK: Log Levels:
// 0: trace
// 1: debug
// 2: info
// 3: warn
// 4: error
// 5: silent

export type DropdownMenuLogger = {
    trace(...args: unknown[]): void;
    debug(...args: unknown[]): void;
    info(...args: unknown[]): void;
    warn(...args: unknown[]): void;
    error(...args: unknown[]): void;
};

export type DropdownMenuLoggers = {
    dropdownMenuLogger: DropdownMenuLogger;
    dropdownItemLogger: DropdownMenuLogger;
    dropdownMenuCoreLogger: DropdownMenuLogger;
    dropdownMenuScrollArrowLogger: DropdownMenuLogger;
    customScrollbarLogger: DropdownMenuLogger;
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

export type SetLoggers =
    | Partial<DropdownMenuLoggers>
    | ((loggers: DropdownMenuLoggers) => Partial<DropdownMenuLoggers> | void);

/**
 * Sets the loggers for the dropdown menu components.
 *
 * @param loggers - An object containing the loggers to set, or a function that
 * takes the current loggers and returns such an object or void to indicate no
 * reassignments to the loggers. The latter form allows for in-place mutation of
 * the loggers.
 */
export function setLoggers(
    loggers: SetLoggers
): void {

    const newLoggers =
        typeof loggers === "function"
            ? loggers({
                dropdownMenuLogger,
                dropdownItemLogger,
                dropdownMenuCoreLogger,
                dropdownMenuScrollArrowLogger,
                customScrollbarLogger
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
