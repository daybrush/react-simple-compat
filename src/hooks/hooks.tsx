import { createRef } from "../base/createRef";
import { getCurrentInstance, getHooksIndex, Provider, setHooksInex } from "../base/Provider";
import { Ref } from "../types";
import { isDiff } from "../utils";

interface HookState {
    type: number;
    func: any;
    value?: any;
    deps: any[];
}
interface HookProvider extends Provider {
    /**
     * Hook States
     */
    _hs: HookState[];
}

function checkHookState(state: HookState) {
    const inst = getCurrentInstance() as HookProvider;
    const hooks = inst._hs || (inst._hs = []);
    const index = getHooksIndex();
    const prevHt = hooks[index];

    setHooksInex(index + 1);
    if (prevHt) {
        if (!isDiff(prevHt.deps, state.deps)) {
            return prevHt;
        }
        hooks[index] = state;
    } else {
        hooks.push(state);
    }

    state.value = state.func();
    return state;
}

export function useMemo(defaultFunction: () => any, deps?: any[]): any {
    const state = checkHookState({
        type: 0,
        func: defaultFunction,
        deps,
    });

    return state.value;
}

export function useRef(defaultValue: any): any {
    return useMemo(() => createRef(defaultValue), []);
}
