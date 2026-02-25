import {
    type JSX,
    type MouseEventHandler,
    type ReactNode,
    type Ref,
    type RefObject,
    type SyntheticEvent
} from "react";

import {
    type RequestOpenChangeEvent,
    DropdownToggle
} from "dropdown-menu";

function CustomComponent(
    props: {
        foo: string;
        onClick: (event: RequestOpenChangeEvent) => void;
        ref: Ref<HTMLElement | null>;
    }
): ReactNode {
    return null;
}

function CustomComponent2(
    props: {
        onClick?: (event: RequestOpenChangeEvent) => void;
        ref?: Ref<HTMLButtonElement>;
    }
): ReactNode {
    return null;
}

function CustomComponent3(
    props: {
        onClick: (event: RequestOpenChangeEvent) => void | undefined | null;
        ref?: Ref<HTMLElement>;
        bar?: number;
    }
): ReactNode {
    return null;
}


function CustomComponent4(
    props: {
        foo: string;
        bar: number;
        onClick: (event: RequestOpenChangeEvent) => void;
        ref: Ref<HTMLDivElement>;
    }
): ReactNode {
    return null;
}

function CustomComponent5(
    props: {
        foo: string;
        onClick: ((event: RequestOpenChangeEvent) => void) | null;
        ref: (element: HTMLElement | null) => void;
    }
): ReactNode {
    return null;
}

function CustomComponent6(
    props: {
        foo: string;
        onClick: ((event: RequestOpenChangeEvent) => void) | undefined;
        ref?: (element: HTMLElement | null) => void;
    }
): ReactNode {
    return null;
}

function CustomComponent7(
    props: {
        onClick: ((event: never) => void) | null | undefined;
        ref?: (element: HTMLButtonElement | null) => void;
    }
): ReactNode {
    return null;
}

function CustomComponent8(
    props: {
        onClick?: ((event: never) => void) | null | undefined;
        ref?: (element: never) => void;
    }
): ReactNode {
    return null;
}

function CustomComponent9(
    props: {
        foo: string;
        // invalid event type: string is not a subtype of
        // `OnRequestOpenChangeEvent`
        onClick: (event: string) => void;
        ref: Ref<HTMLButtonElement>;
    }
): ReactNode {
    return null;
}

function CustomComponent10(
    props: {
        foo: string;
        onClick?: MouseEventHandler | undefined;
        ref?: Ref<HTMLElement> | undefined;
    }
): ReactNode {
    return null;
}

function CustomComponent11(
    props: {
        foo?: string;
        onClick?: (event: Event) => void;
        // This works because of React's bivariance hack for refs. It's not
        // safe, but don't try to fight the type system.
        ref: Ref<Node>;
    }
): ReactNode {
    return null;
}

function CustomComponent12(
    props: {
        foo?: string;
        onClick?: (event: SyntheticEvent) => void;
        ref: (element: HTMLButtonElement) => void;
    }
): ReactNode {
    return null;
}

function CustomComponent13(
    props: {
        foo?: string;
        onClick?: (event: SyntheticEvent) => void;
        // invalid ref type: `Ref<number>` is not compatible with
        // `Ref<HTMLElement>` because `number` is not a subtype of `HTMLElement`
        ref: Ref<number>;
    }
): ReactNode {
    return null;
}

function CustomComponent14(
    props: {
        foo?: string;
        onClick?: (event: SyntheticEvent) => void;
        // invalid ref type
        ref: (element: Node) => void;
    }
): ReactNode {
    return null;
}

function CustomComponent15(
    props: {
        foo?: string;
        onClick?: (event: SyntheticEvent) => void;
        // missing ref
    }
): ReactNode {
    return null;
}

function CustomComponent16(
    props: {
        bar: string;
        // missing required onClick prop
        ref: Ref<HTMLElement>;
    }
): ReactNode {
    return null;
}

function CustomComponent17(
    props: {
        bar: string;
        // missing required onClick prop
        // missing ref
    }
): ReactNode {
    return null;
}

function CustomComponent18(
    props: {
        foo: string;
        onClick?: (event: SyntheticEvent) => void;
        // invalid ref type: `RefObject<HTMLElement>` is not compatible with
        // `RefCallback<HTMLElement>`
        ref: RefObject<HTMLElement>;
    }
): ReactNode {
    return null;
}


export function TestDropdownToggle(): JSX.Element {

    return (
        <>
            <DropdownToggle />

            <DropdownToggle
                onClick={() => console.log("Toggle clicked")}
            />

            <DropdownToggle
                onClick={() => console.log("Toggle clicked")}
            >
                Toggle with children world is cool
            </DropdownToggle>

            <DropdownToggle
                as="a"
                href="#"
                style={{
                    color: "blue",
                }}
                onClick={() => console.log("Link toggle clicked")}
            />

            <DropdownToggle
                as="a"
                href="#"
                data-xyz="test"
            />

            <DropdownToggle
                as="a"
                href="#"
                onClick={(e) => console.log("Link toggle clicked", e)}
            />

            <DropdownToggle
                as="button"
                type="submit"
                disabled
            />

            <DropdownToggle
                as="button"
                // @ts-expect-error -- `href` is not a valid button prop
                href="#"
            />

            <DropdownToggle
                as="input"
                value="test"
                onChange={() => console.log("Input changed")}
            />

            <DropdownToggle
                as="input"
                // @ts-expect-error -- `href` is not a valid input prop
                href="#"
            />

            <DropdownToggle
                as="textarea"
                rows={2}
                defaultValue="hello"
            />

            <DropdownToggle
                as="textarea"
                // @ts-expect-error -- `type` is not a valid textarea prop
                type="button"
            />

            <DropdownToggle
                as="textarea"
            />

            <DropdownToggle
                as={CustomComponent}
                foo="test"
                onClick={() => console.log("Custom component toggle clicked")}
            />

            <DropdownToggle
                as={CustomComponent}
                foo="test"
            />

            {/* @ts-expect-error -- Missing required custom props `foo` */}
            <DropdownToggle
                as={CustomComponent}
            />

            <DropdownToggle
                as={CustomComponent2}
                onClick={() => console.log("Custom component toggle clicked")}
            />

            <DropdownToggle
                as={CustomComponent2}
            />

            <DropdownToggle
                as={CustomComponent3}
                onClick={() => console.log("Custom component toggle clicked")}
            />

            <DropdownToggle
                as={CustomComponent3}
                bar={123}
            />

            <DropdownToggle
                as={CustomComponent4}
                foo="test"
                bar={123}
                onClick={() => console.log("Custom component toggle clicked")}
            />

            <DropdownToggle
                as={CustomComponent4}
                foo="test"
                bar={123}
            />

            <DropdownToggle
                as={CustomComponent5}
                foo="test"
                onClick={() => console.log("Custom component toggle clicked")}
            />

            <DropdownToggle
                as={CustomComponent5}
                foo="test"
            />

            <DropdownToggle
                as={CustomComponent6}
                foo="test"
                onClick={() => console.log("Custom component toggle clicked")}
            />

            <DropdownToggle
                as={CustomComponent6}
                foo="test"
            />

            <DropdownToggle
                as={CustomComponent7}
                onClick={() => console.log("Custom component toggle clicked")}
            />

            <DropdownToggle
                as={CustomComponent7}
            />

            <DropdownToggle
                // @ts-expect-error -- Invalid `as` component with incompatible
                // `onClick` event type
                as={CustomComponent9}
                foo="test"
                onClick={() => console.log("Custom component toggle clicked")}
            />

            <DropdownToggle
                // @ts-expect-error -- Invalid `as` component with incompatible
                // `onClick` event type
                as={CustomComponent9}
                foo="test"
            />

            <DropdownToggle
                as={CustomComponent10}
                foo="test"
            />

            <DropdownToggle
                as={CustomComponent11}
                foo="test"
            />

            <DropdownToggle
                as={CustomComponent11}
            />

            <DropdownToggle
                as={CustomComponent12}
                foo="test"
            />

            <DropdownToggle
                as={CustomComponent12}
            />

            <DropdownToggle
                // @ts-expect-error -- Invalid `as` component with incompatible
                // `ref` type: `Ref<number>` is not compatible with
                // `Ref<HTMLElement>` because `number` is not a subtype of
                // `HTMLElement`
                as={CustomComponent13}
                foo="test"
            />

            <DropdownToggle
                // @ts-expect-error -- Invalid `as` component with incompatible
                // `ref` type: `Ref<number>` is not compatible with
                // `Ref<HTMLElement>` because `Node` is not a subtype of
                // `HTMLElement`
                as={CustomComponent14}
                foo="test"
            />

            <DropdownToggle
                // @ts-expect-error -- Invalid `as` component: missing ref
                as={CustomComponent15}
            />

            <DropdownToggle
                // @ts-expect-error -- Invalid `as` component that does not
                // accept required `onClick`
                as={CustomComponent16}
                bar="test"
            />

            <DropdownToggle
                // @ts-expect-error -- Invalid `as` component: missing ref and
                // `onClick`
                as={CustomComponent17}
                bar="test"
            />

            <DropdownToggle
                // @ts-expect-error -- Invalid `as` component with incompatible
                // ref type: `RefObject<HTMLElement>` is not compatible with
                // `RefCallback<HTMLElement>`
                as={CustomComponent18}
                foo="test"
            />
        </>
    );

}
