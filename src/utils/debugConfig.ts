export type DebugConfig = {

    /**
     * If set to true, disables all keyboard event handling for the dropdown
     * menus.
     */
    disableMenuKeyEvents: boolean;

    /**
     * If set to true, show menu IDs next to dropdown menus for debugging
     * purposes.
     */
    showMenuIds: boolean;

    /**
     * If set to true, visually shows the hitboxes for custom scrollbars for
     * debugging purposes.
     */
    showScrollScrollbarHitboxes: boolean;

    /**
     * If set to true, uses an expanded scrollbar hitbox for ALL devices,
     * whereas it is normally only expanded for devices that primarily use touch
     * input.
     */
    mouseExpandedHitbox: boolean;

    /**
     * If set to true, disables expanded scrollbar hitboxes for ALL devices,
     * whereas it is normally only expanded for devices that primarily use touch
     * input.
     */
    disableExpandedHitbox: boolean;

    /**
     * If set to true, attaches debug utilities to the global window object
     * for easy access from the browser console.
     */
    exposeDebugUtilitiesOnWindow: boolean;
};

/**
 * Default debug configuration. This can be changed via setDebugConfig. Never
 * mutate this object directly, as it is frozen.
 */
export const defaultDebugConfig = Object.freeze<DebugConfig>({
    disableMenuKeyEvents: false,
    showMenuIds: false,
    showScrollScrollbarHitboxes: false,
    mouseExpandedHitbox: false,
    disableExpandedHitbox: false,
    exposeDebugUtilitiesOnWindow: false,
});

/**
 * Debug configuration options for the dropdown menu.
 */
let debugConfig: Readonly<DebugConfig> = defaultDebugConfig;

const debugConfigChangeListeners = new Set<() => void>();

function notifyDebugConfigChange(): void {
    for (const listener of debugConfigChangeListeners) {
        listener();
    }
}

/**
 * Sets debug configuration options for the dropdown menu.
 *
 * @param newConfig - An object containing the debug configuration options to
 * set.
 */
export function setDebugConfig(newConfig: Partial<DebugConfig>): void {
    debugConfig = {
        ...debugConfig,
        ...newConfig
    };
    notifyDebugConfigChange();
}

export function getDebugConfig(): Readonly<DebugConfig> {
    return debugConfig;
}

export function subscribeToDebugConfig(
    listener: () => void
): () => void {
    debugConfigChangeListeners.add(listener);
    return () => {
        debugConfigChangeListeners.delete(listener);
    };
}
