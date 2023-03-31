import { Ref } from "../types";

export function createRef(defaultValue: any): Ref {
    const refCallback = (e: any) => {
        refCallback.current = e;
    };
    refCallback.current = defaultValue;

    return refCallback;
}
