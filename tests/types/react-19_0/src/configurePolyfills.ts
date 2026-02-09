import type { JSDOM } from "jsdom";

export function configurePolyfills(
    dom: JSDOM
): void {

    (globalThis as any).window = dom.window;
    (globalThis as any).document = dom.window.document;
    (globalThis as any).HTMLElement = dom.window.HTMLElement;
    // (globalThis as any).navigator = dom.window.navigator;
    (globalThis as any).MutationObserver = dom.window.MutationObserver;
    globalThis.visualViewport = dom.window.visualViewport;

    function fallbackRequestAnimationFrame(callback: FrameRequestCallback): number {
        const id = setTimeout(() => {
            callback(Date.now());
        }, 0);
        return Number(id);
    }

    function fallbackCancelAnimationFrame(handle: number): void {
        clearTimeout(handle);
    }

    const requestAnimationFrameImpl = dom.window.requestAnimationFrame
        ? dom.window.requestAnimationFrame.bind(dom.window)
        : fallbackRequestAnimationFrame;

    const cancelAnimationFrameImpl = dom.window.cancelAnimationFrame
        ? dom.window.cancelAnimationFrame.bind(dom.window)
        : fallbackCancelAnimationFrame;

    (globalThis as any).requestAnimationFrame = requestAnimationFrameImpl;
    (globalThis as any).cancelAnimationFrame = cancelAnimationFrameImpl;

    class ResizeObserverPolyfill {
        private readonly callback: ResizeObserverCallback;

        constructor(callback: ResizeObserverCallback) {
            this.callback = callback;
        }

        observe(_target: Element): void {
            this.callback([], this as unknown as ResizeObserver);
        }

        unobserve(_target: Element): void {
            // no-op
        }

        disconnect(): void {
            // no-op
        }
    }

    (globalThis as any).ResizeObserver = dom.window.ResizeObserver
        ?? ResizeObserverPolyfill;

    // polyfill required browser APIs
    (window as any).matchMedia = (): MediaQueryList => ({
        matches: false,
        media: "",
        onchange: null,
        addListener(): void { },
        removeListener(): void { },
        addEventListener(): void { },
        removeEventListener(): void { },
        dispatchEvent(): boolean { return false; }
    });

    function installNoopScrollTo(): void {
        if (typeof window === "undefined") {
            return;
        }

        if (typeof window.scrollTo !== "function") {
            window.scrollTo = (): void => { };
        }

        if (typeof HTMLElement !== "undefined") {
            const proto = HTMLElement.prototype;

            if (typeof proto.scrollTo !== "function") {
                proto.scrollTo = (): void => { };
            }
        }
    }

    installNoopScrollTo();

}
