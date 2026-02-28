import * as t from "@babel/types";
import type {
    JSXElement,
    Program
 } from "@babel/types";

type TemplateVariables = {
    componentName: string;
    jsx: JSXElement;
};

type TemplateContext = {
    tpl: (
        strings: TemplateStringsArray,
        ...values: unknown[]
    ) => Program;
};

export default function template(
    { componentName, jsx }: TemplateVariables,
    { tpl }: TemplateContext
): Program {

    // find the <svg> opening element
    const opening = jsx.openingElement;

    const size = "0.7";

    // add attributes
    opening.attributes.push(
        t.jsxAttribute(
            t.jsxIdentifier("width"),
            t.stringLiteral(`${size}em`)
        ),
        t.jsxAttribute(
            t.jsxIdentifier("height"),
            t.stringLiteral(`${size}em`)
        ),
        t.jsxAttribute(
            t.jsxIdentifier("fill"),
            t.stringLiteral("currentColor")
        )
    );

    const name = componentName.replace(/^Svg/, "SVG");

    return tpl`
import type {
    SVGProps,
    JSX
} from "react";

export function ${name}(
    props: SVGProps<SVGSVGElement>
): JSX.Element {
    return (
        ${jsx}
    );
}
`;
}
