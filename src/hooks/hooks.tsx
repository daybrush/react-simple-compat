import { createRef } from "../base/createRef";
import { getCurrentInstance, getHooksIndex, Provider, setHooksInex } from "../base/Provider";
import { Ref } from "../types";
import { isDiff } from "../utils";

interface HookState {
    type: number;
    value: any;
    deps: any[];
}
interface HookProvider extends Provider {
    /**
     * Hook States
     */
    _hts: HookState[];
}

function checkHookState(state: HookState) {
    const inst = getCurrentInstance() as HookProvider;
    const hts = inst._hts || (inst._hts = []);
    const index = getHooksIndex();
    const prevHt = hts[index];

    setHooksInex(index + 1);
    if (prevHt) {
        if (isDiff(prevHt.deps, state.deps)) {
            hts[index] = state;

            return state;
        }
        return prevHt;
    } else {
        hts.push(state);
    }
    return state;
}

export function useRef(defaultValue: any): any {
    const state = checkHookState({
        type: 0,
        value: createRef(defaultValue),
        deps: [],
    });

    return state.value;
}
