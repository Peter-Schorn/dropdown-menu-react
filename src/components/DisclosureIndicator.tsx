import {
    type JSX,
    type CSSProperties,
    type PropsWithChildren,
    useContext
} from "react";

import {
    DisclosureIndicatorContext
} from "../model/DisclosureIndicatorContext";

/**
 * Props for the `DisclosureIndicator` component.
 */
export type DisclosureIndicatorProps = PropsWithChildren & {
    /**
     * Class name(s) to apply to the `DisclosureIndicator` component. If
     * provided, these will be used instead of the default class.
     */
    className?: string;

    /**
     * Optional inline styles to apply to the `DisclosureIndicator` component.
     */
    style?: CSSProperties;
};

/**
 * A disclosure indicator component that shows a right-pointing caret icon.
 *
 * The icon's color changes based on the open/closed state of the submenu, which
 * is determined by the `DisclosureIndicatorContext`. When the submenu is open,
 * the icon is black; when closed, it is gray.
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
 * @param props - The props for this component.
 * @param props.className - Class name(s) to apply to this component. If
 * provided, these will be used instead of the default class. The DOM node that
 * this class is applied to will have a `data-submenu-open` attribute that
 * reflects the open/closed state of the submenu, which can be used in CSS to
 * style the indicator based on that state. For example:
 * ```css
 * .my-indicator[data-submenu-open="true"] {
 *     color: black;
 * }
 * .my-indicator[data-submenu-open="false"] {
 *     color: gray;
 * }
 * ```
 * @param props.style - Optional inline styles to apply to this component.
 * @param props.children - Optional custom content to render instead of the
 * default disclosure icon. If not provided, a default right-pointing caret icon
 * will be rendered.
 */
export function DisclosureIndicator(
    {
        className,
        style,
        children
    }: DisclosureIndicatorProps
): JSX.Element {

    const {
        submenuIsOpen
    } = useContext(DisclosureIndicatorContext);

    const defaultClassName = "bd-disclosure-indicator";

    const resolvedClassName = className ? className : defaultClassName;

    return (
        <span
            className={resolvedClassName}
            style={style}
            data-submenu-open={submenuIsOpen}
        >
            {
                children === undefined || children === null
                    ? <i className="fa-solid fa-caret-right" />
                    : children
            }
        </span>
    );

}

DisclosureIndicator.displayName = "DisclosureIndicator";
