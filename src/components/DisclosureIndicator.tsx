import {
    type JSX,
    useContext
} from "react";

import {
    DisclosureIndicatorContext
} from "../model/DisclosureIndicatorContext";

export function DisclosureIndicator(): JSX.Element {

    const {
        submenuIsOpen
    } = useContext(DisclosureIndicatorContext);

    return (
        <span
            style={{
                color: submenuIsOpen ? "black" : "gray"
            }}
        >
            <i className="fa-solid fa-caret-right"></i>
        </span>
    );

}

DisclosureIndicator.displayName = "DisclosureIndicator";
