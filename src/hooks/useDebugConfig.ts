import {
    useSyncExternalStore
} from "react";

import {
    type DebugConfig,
    subscribeToDebugConfig,
    getDebugConfig
} from "../utils/debugConfig";

export function useDebugConfig(): DebugConfig {
    return useSyncExternalStore(
        subscribeToDebugConfig,
        getDebugConfig,
        getDebugConfig
    );
}
