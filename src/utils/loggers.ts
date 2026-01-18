import log from "loglevel";

// MARK: Log Levels:
// 0: trace
// 1: debug
// 2: info
// 3: warn
// 4: error
// 5: silent

export const dropdownMenuLogger = log.getLogger(
    "DropdownMenu"
);

export const dropdownItemLogger = log.getLogger(
    "DropdownItem"
);

export const dropdownMenuCoreLogger = log.getLogger(
    "DropdownMenuCore"
);

export const dropdownMenuScrollArrowLogger = log.getLogger(
    "DropdownMenuScrollArrow"
);

export const customScrollbarLogger = log.getLogger(
    "CustomScrollbar"
);
