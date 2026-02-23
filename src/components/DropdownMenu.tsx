import {
    type JSX,
    type ReactNode,
    type PropsWithChildren,
    memo
} from "react";

export type DropdownMenuProps = PropsWithChildren;

// TODO: Move
// /**
//  * A dropdown menu component that serves as the root of the dropdown menu. It
//  * should wrap a {@link DropdownMenu} component, which contains the actual menu
//  * content, and a DropdownToggle component, which is used to toggle the opening
//  * and closing of the menu.
//  */


const _DropdownMenu = memo(function DropdownMenuMemo(
    {
        children
    }: DropdownMenuProps
): JSX.Element {

    return (
        <div>
            {children}
        </div>
    );

});

// use any to exclude from the generated .d.ts file
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
(_DropdownMenu as any).displayName = "DropdownMenu";

export const DropdownMenu = _DropdownMenu as
    (props: DropdownMenuProps) => ReactNode;
