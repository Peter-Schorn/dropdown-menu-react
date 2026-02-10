export type PointerType = "mouse" | "pen" | "touch";


export type HitboxTestableEventConstructor = {
    clientX: number;
    clientY: number;
    pointerType: PointerType;
    event: Event;

    preventDefault: () => void;
    stopImmediatePropagation: () => void;
    stopPropagation: () => void;
};

/**
 * An event that contains the necessary properties to perform hitbox testing.
 * Abstracts over PointerEvent and TouchEvent.
 *
 * This includes the clientX and clientY coordinates of the event, as well as
 * methods to prevent default behavior and stop propagation.
 */
export class HitboxTestableEvent {

    clientX: number;
    clientY: number;
    pointerType: PointerType;
    event: Event;

    private _preventDefault: () => void;
    private _stopImmediatePropagation: () => void;
    private _stopPropagation: () => void;

    /**
     * Creates a HitboxTestableEvent from a PointerEvent.
     *
     * @param event - the PointerEvent.
     * @returns the HitboxTestableEvent.
     */
    static fromPointerEvent(
        event: PointerEvent
    ): HitboxTestableEvent {
        return new HitboxTestableEvent({
            clientX: event.clientX,
            clientY: event.clientY,
            pointerType: event.pointerType as PointerType,
            event,
            // anonymous arrow function are necessary to bind 'this' correctly
            preventDefault: () => event.preventDefault(),
            stopImmediatePropagation: () => event.stopImmediatePropagation(),
            stopPropagation: () => event.stopPropagation()
        });
    }

    /**
     * Creates a HitboxTestableEvent from a TouchEvent and a specific Touch.
     *
     * @param event - the TouchEvent.
     * @param touch - the Touch within the TouchEvent to use.
     * @returns the HitboxTestableEvent.
     */
    static fromTouchEvent(
        event: TouchEvent,
        touch: Touch
    ): HitboxTestableEvent {
        return new HitboxTestableEvent({
            clientX: touch.clientX,
            clientY: touch.clientY,
            pointerType: "touch",
            event,
            // anonymous arrow function are necessary to bind 'this' correctly
            preventDefault: () => event.preventDefault(),
            stopImmediatePropagation: () => event.stopImmediatePropagation(),
            stopPropagation: () => event.stopPropagation()
        });

    }

    /**
     * Creates a HitboxTestableEvent.
     *
     *  @param options - the constructor options.
     */
    constructor(options: HitboxTestableEventConstructor) {
        this.clientX = options.clientX;
        this.clientY = options.clientY;
        this.pointerType = options.pointerType;
        this.event = options.event;
        this._preventDefault = options.preventDefault;
        this._stopImmediatePropagation = options.stopImmediatePropagation;
        this._stopPropagation = options.stopPropagation;
    }

    preventDefault(): void {
        this._preventDefault();
    }

    stopImmediatePropagation(): void {
        this._stopImmediatePropagation();
    }

    stopPropagation(): void {
        this._stopPropagation();
    }
}
