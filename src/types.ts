import { Component } from "./base/Component";
import { Provider } from "./base/Provider";

export interface CompatElement {
    type: any;
    key: any;
    ref: Ref;
    props: {
        children: Array<string | CompatElement>,
        [key: string]: any,
    };
}


export interface Context {
    $_id: string,
    $_dv: any,
    Provider: FunctionComponent;
    Consumer: FunctionComponent;
    get(provider: Provider): any;
    register(provider: Provider): void;
    unregister(provider: Provider): void;
}

export type FunctionComponent
    = ((props: any, context?: any) => any)
    & {
        defaultProps?: any;
        contextType?: Context;
    };

export interface Ref {
    (cur: any): void;
    current: any;
}
