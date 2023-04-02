import { ComponentProvider } from "../base/ComponentProvider";
import { createRef } from "../base/refs";
import { getCurrentInstance, getHooksIndex, setHooksInex } from "../base/Provider";
import { Context, Ref } from "../types";
import { isDiff } from "../utils";
import type { Component } from "../base/Component";
import { isFunction } from "@daybrush/utils";

interface HookInfo {
    func?: any;
    effect?: (() => any) | void;
    value?: any;
    updated?: boolean;
    deps: any[];
}
interface HookProvider extends ComponentProvider {
    /**
     * Hook States
     */
    _hs: HookInfo[];
}

function checkHookInfo(info: HookInfo) {
    const inst = getCurrentInstance() as HookProvider;
    const hooks = inst._hs || (inst._hs = []);
    const index = getHooksIndex();
    const prevHt = hooks[index];

    setHooksInex(index + 1);

    if (prevHt) {
        if (!isDiff(prevHt.deps, info.deps)) {
            prevHt.updated = false;
            return prevHt;
        }
        hooks[index] = info;
    } else {
        hooks.push(info);
    }
    info.value = info.func();
    info.updated = true;
    return info;
}

export function useMemo(defaultFunction: () => any, deps?: any[]): any {
    const info = checkHookInfo({
        func: defaultFunction,
        deps,
    });

    return info.value;
}

export function useRef(defaultValue: any): any {
    return useMemo(() => createRef(defaultValue), []);
}

export function useContext(context: Context) {
    const inst = getCurrentInstance() as HookProvider;
    const contextId = context.$_id;
    const contexts = inst._cs;
    let providerComponent!: Component;
    let contextValue: any;
    if (contextId in contexts) {
        providerComponent = contexts[contextId];
        contextValue = providerComponent.props.value;
    } else {
        contextValue = context.$_dv;
    }

    useEffect(() => {
        context.register(inst);

        return () => {
            context.unregister(inst);
        };
    }, []);

    return context.get(inst);
}
export function useState(st?: any | (() => any)): [any, (nextValue: any) => void] {
    const inst = getCurrentInstance() as HookProvider;
    const index = getHooksIndex();
    const comp = inst.b;

    checkHookInfo({
        func: () => {
            comp.state[index] = isFunction(st) ? st() : st;
        },
        deps: [],
    });
    return [
        comp.state[index],
        (nextValue: any) => comp.setState({ [index]: nextValue }),
    ];
}
export function useEffect(effect: () => (() => any) | undefined | void, deps?: any[], unshift?: boolean) {
    const inst = getCurrentInstance() as HookProvider;
    const info = checkHookInfo({
        func: () => effect,
        deps,
    });
    const effects = (unshift ? inst._usefs : inst._uefs);

    if (info.updated) {
        effects.push(() => {
            info.effect && info.effect();
            info.effect = effect();

            return info.effect;
        });
    } else {
        effects.push(() => info.effect);
    }
}

export function useImperativeHandle(ref: Ref, func: () => any, deps?: any[]) {
    useEffect(() => {
        ref(func());
    }, deps, true);
}


