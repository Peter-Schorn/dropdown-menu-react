// MARK: Log Levels:
// 0: trace
// 1: debug
// 2: info
// 3: warn
// 4: error
// 5: silent

export interface DropdownMenuLogger {
    trace(...args: unknown[]): void;
    debug(...args: unknown[]): void;
    info(...args: unknown[]): void;
    warn(...args: unknown[]): void;
    error(...args: unknown[]): void;
}

export interface DropdownMenuLoggers {
    dropdownMenuLogger: DropdownMenuLogger;
    dropdownItemLogger: DropdownMenuLogger;
    dropdownMenuCoreLogger: DropdownMenuLogger;
    dropdownMenuScrollArrowLogger: DropdownMenuLogger;
    customScrollbarLogger: DropdownMenuLogger;
}

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
 * Sets the loggers for the dropdown menu components.
 */
export function setLoggers(
    loggers: Partial<DropdownMenuLoggers>
): void {
    if (loggers.dropdownMenuLogger) {
        dropdownMenuLogger = loggers.dropdownMenuLogger;
    }
    if (loggers.dropdownItemLogger) {
        dropdownItemLogger = loggers.dropdownItemLogger;
    }
    if (loggers.dropdownMenuCoreLogger) {
        dropdownMenuCoreLogger = loggers.dropdownMenuCoreLogger;
    }
    if (loggers.dropdownMenuScrollArrowLogger) {
        dropdownMenuScrollArrowLogger =
            loggers.dropdownMenuScrollArrowLogger;
    }
    if (loggers.customScrollbarLogger) {
        customScrollbarLogger = loggers.customScrollbarLogger;
    }
}
