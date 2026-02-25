import {
    type JSX,
    useState
} from "react";

import {
    type DropdownMenuLoggers,
    type DropdownMenuLogger,
    Dropdown,
    DropdownToggle,
    DropdownMenu,
    DropdownItem,
    DisclosureIndicator,
    DropdownDivider,
    DropdownItemLabel,
    DropdownItemSubmenu,
    setLoggers,
    setConsoleLoggers
} from "dropdown-menu";

// this will be overridden below, but call it just to verify it doesn't error
setConsoleLoggers();

function makeLogger(
    name: string
): DropdownMenuLogger {

    const regex = /(.+)Logger/g;

    const prefix = name.replace(regex, "[$1]");

    return {
        trace: console.trace.bind(console, prefix),
        debug: console.debug.bind(console, prefix),
        info: console.info.bind(console, prefix),
        warn: console.warn.bind(console, prefix),
        error: console.error.bind(console, prefix),
    };
}

setLoggers((loggers) => {

    for (
        const name of Object.keys(loggers) as (keyof DropdownMenuLoggers)[]
    ) {
        loggers[name] = makeLogger(name);
    }

    return loggers;

});


function TestComponent1(): JSX.Element {

    console.log("inside TestComponent1");

    return (
        <Dropdown>
            <DropdownToggle>
                Menu
            </DropdownToggle>
            <DropdownMenu>
                <DropdownItem>
                    <DropdownItemLabel>
                        New Tab
                    </DropdownItemLabel>
                </DropdownItem>
                <DropdownDivider />
                <DropdownItem
                    submenuID="file-submenu"
                >
                    <DropdownItemLabel>
                        File
                        <DisclosureIndicator />
                    </DropdownItemLabel>
                    <DropdownItemSubmenu>
                        <DropdownItem>
                            <DropdownItemLabel>
                                Open
                            </DropdownItemLabel>
                        </DropdownItem>
                        <DropdownItem>
                            <DropdownItemLabel>
                                Save
                            </DropdownItemLabel>
                        </DropdownItem>
                    </DropdownItemSubmenu>
                </DropdownItem>
            </DropdownMenu>
        </Dropdown>
    );

}

function TestComponent2(): JSX.Element {

    const [menuIsOpen, setMenuIsOpen] = useState(true);

    return (
        <Dropdown
            isOpen={menuIsOpen}
            onRequestOpenChange={(options) => {
                setMenuIsOpen(options.open);
            }}
        >
            <DropdownToggle>
                Menu
            </DropdownToggle>
            <DropdownMenu>
                <DropdownItem>
                    <DropdownItemLabel>
                        New Tab
                    </DropdownItemLabel>
                </DropdownItem>
                <DropdownDivider />
                <DropdownItem
                    submenuID="file-submenu"
                >
                    <DropdownItemLabel>
                        File
                        <DisclosureIndicator />
                    </DropdownItemLabel>
                    <DropdownItemSubmenu>
                        <DropdownItem>
                            <DropdownItemLabel>
                                Open
                            </DropdownItemLabel>
                        </DropdownItem>
                        <DropdownItem>
                            <DropdownItemLabel>
                                Save
                            </DropdownItemLabel>
                        </DropdownItem>
                    </DropdownItemSubmenu>
                </DropdownItem>
            </DropdownMenu>
        </Dropdown>
    );

}

export function App(): JSX.Element {
    return (
        <>
            <TestComponent1 />
            <TestComponent2 />
        </>
    );
}
