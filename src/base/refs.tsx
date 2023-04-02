import { Ref } from "../types";

export function createRef(defaultValue?: any): Ref {
    const refCallback = (e: any) => {
        refCallback.current = e;
    };
    refCallback.current = defaultValue;

    return refCallback;
}

export function forwardRef(func: (props: any, ref: Ref) => any) {
    (func as any)._fr = true;
    return func;
}
