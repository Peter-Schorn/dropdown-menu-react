import {
    useCallback,
    useState
} from "react";

/**
 * A custom hook that returns a stable function reference which, when called,
 * forces the component to re-render.
 */
export function useForceUpdate(): () => void {

    const [, setState] = useState<Record<never, never>>({});

    return useCallback((): void => {
        setState({});
    }, []);
}
