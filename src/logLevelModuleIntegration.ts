import log from "loglevel";

import { setLoggers } from "./utils/loggers";

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
