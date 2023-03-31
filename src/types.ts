export interface CompatElement {
    type: any;
    key: any;
    ref: () => any;
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
}

export type FunctionComponent
    = ((props: any, context?: any) => any)
    & {
        defaultProps?: any;
        contextType?: Context;
    };

export interface Ref {
    current: any;
}
