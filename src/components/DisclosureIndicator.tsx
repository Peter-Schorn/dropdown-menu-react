import {
    type ReactNode,
    type ComponentPropsWithRef,
    type ElementType,
    useContext
} from "react";

import {
    SVGSolidCaretRight
} from "./icons/SolidCaretRight";

import {
    DisclosureIndicatorContext
} from "../model/context/DisclosureIndicatorContext";

import { disclosureIndicatorLogger as logger } from "../utils/loggers";

/**
 * Own props for the {@link DisclosureIndicator} component.
 *
 * @public
 */
export type DisclosureIndicatorOwnProps<T extends ElementType = "span"> = {
    /**
     * If not `false` and if `children` is not provided, the
     * {@link DisclosureIndicator} will render a default right-pointing caret
     * icon. If `children` is provided, the `DisclosureIndicator` will render
     * the provided children instead of the default icon, regardless of the
     * value of this prop. Default is `true`.
     */
    useDefaultChildren?: boolean;

    /**
     * The element type to render as. Defaults to "span".
     */
    as?: T;
};

/**
 * Props for the {@link DisclosureIndicator} component.
 *
 * This component is polymorphic via the `as` prop. By default, it renders a
 * `span`. It accepts all props of the chosen `as` element/component.
 *
 * @public
 */
export type DisclosureIndicatorProps<T extends ElementType = "span"> =
    DisclosureIndicatorOwnProps<T> &
    Omit<ComponentPropsWithRef<T>, keyof DisclosureIndicatorOwnProps<T>>;

/**
 * A disclosure indicator component that shows a right-pointing caret icon.
 *
 * The icon's color changes based on the open/closed state of the submenu, which
 * is determined by the `DisclosureIndicatorContext`. When the submenu is open,
 * the icon is black; when closed, it is gray.
 *
 * This component is polymorphic via the `as` prop. By default, it renders a
 * `span` and applies a default class name of `bd-disclosure-indicator` unless a
 * different `className` is provided.
 *
 * If the options below are not sufficient for your use case, you can create
 * your own custom disclosure indicator component and use the
 * `DisclosureIndicatorContext` to access the submenu open/closed state. For
 * example:
 * ```tsx
 * import { useContext } from "react";
 * import { DisclosureIndicatorContext } from "dropdown-menu";
 *
 * function MyCustomDisclosureIndicator() {
 *     const { submenuIsOpen } = useContext(DisclosureIndicatorContext);
 *
 *     return (
 *         <span
 *             className="my-indicator"
 *             // use the submenu open state to set a data attribute that can be
 *             // used for styling in CSS via an attribute selector
 *             data-submenu-open={submenuIsOpen}
 *         >
 *             ▶︎
 *         </span>
 *     );
 * }
 * ```
 *
 * @public
 *
 * @param props - An object containing:
 * - `useDefaultChildren`: If not `false` and if `children` is not provided,
 *    will render a default right-pointing caret icon. If `children` is
 *    provided, the `DisclosureIndicator` will render the provided children
 *    instead of the default icon, regardless of the value of this prop. Default
 *    is `true`.
 * - `as`: The element/component to render as. Defaults to `"span"`.
 * - Any additional props supported by the chosen `as` element/component.
 * - `className`: If not provided, defaults to `bd-disclosure-indicator`. The
 *   rendered element will have a `data-submenu-open` attribute that reflects
 *   the open/closed state of the submenu, which can be used in CSS to style the
 *   indicator based on that state. For example:
 * ```css
 * .my-indicator[data-submenu-open="true"] {
 *     color: black;
 * }
 * .my-indicator[data-submenu-open="false"] {
 *     color: gray;
 * }
 * ```
 */
export function DisclosureIndicator<T extends ElementType = "span">(
    props: DisclosureIndicatorProps<T>
): ReactNode {

    const {
        as,
        useDefaultChildren = true,
        className = "bd-disclosure-indicator",
        children,
        ...rest
    } = props;

    const {
        submenuIsOpen
    } = useContext(DisclosureIndicatorContext);

    const Component = as ?? "span";

    logger.debug(
        `DisclosureIndicator: render; submenuIsOpen: ${submenuIsOpen}`
    );

    const resolvedChildren = children !== undefined && children !== null
        ? children
        : useDefaultChildren
            ? <SVGSolidCaretRight />
            : undefined;

    return (
        <Component
            className={className}
            data-submenu-open={submenuIsOpen}
            {...rest}
        >
            {resolvedChildren}
        </Component>
    );

}

// use any to exclude from the generated .d.ts file
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
(DisclosureIndicator as any).displayName = "DisclosureIndicator";
