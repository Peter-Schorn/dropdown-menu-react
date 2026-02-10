import {
    type JSX
} from "react";

/**
 * A simple divider component that renders a horizontal rule (`<hr>`) with the
 * class `bd-dropdown-divider`. This can be used to visually separate groups of
 * items within the dropdown menu.
 *
 * @public
 */
export function DropdownDivider(): JSX.Element {
    return (
        <hr className="bd-dropdown-divider" />
    );
}

// use any to exclude from the generated .d.ts file
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
(DropdownDivider as any).displayName = "DropdownDivider";
