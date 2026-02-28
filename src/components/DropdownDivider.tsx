import {
    type JSX,
    type ComponentPropsWithRef
} from "react";

/**
 * Props for the {@link DropdownDivider} component.
 *
 * Accepts all props for an `hr` element, including `ref`.
 *
 * @public
 */
export type DropdownDividerProps = ComponentPropsWithRef<"hr">;

/**
 * A simple divider component that renders a horizontal rule (`<hr>`). This can
 * be used to visually separate groups of items within the dropdown menu.
 *
 * If `className` is not provided, it defaults to `bd-dropdown-divider`.
 *
 * Accepts all props for an `hr` element, including `ref`, so you can customize
 * it as needed.
 *
 * @public
 */
export function DropdownDivider(
    {
        className = "bd-dropdown-divider",
        ...rest
    }: DropdownDividerProps
): JSX.Element {
    return (
        <hr
            className={className}
            {...rest}
        />
    );
}

// use any to exclude from the generated .d.ts file
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
(DropdownDivider as any).displayName = "DropdownDivider";
