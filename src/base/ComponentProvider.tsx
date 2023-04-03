import { IObject } from "@daybrush/utils";
import { HookInfo, HooksProvider } from "../hooks/hooks";
import { renderProviders } from "../renderProviders";
import { Context, Ref } from "../types";
import { fillProps, renderFunctionComponent } from "../utils";
import { Component } from "./Component";
import { Provider } from "./Provider";
import { createRef } from "./refs";


export function createComponent(
    type: any,
    props: any,
    contextValue: any,
    self: any,
) {
    let base!: Component;
    if (type?.prototype?.render) {
        base = new type(props, contextValue);
    } else {
        base = new Component(props, contextValue);
        base.constructor = type;

        if (type._fr) {
            self.fr = createRef();
            base.render = function (this: Component) {
                return this.constructor(this.props, self.fr);
            }
        } else {
            base.render = renderFunctionComponent;
        }
    }
    base.$_p = self;
    return base;
}

export class ComponentProvider extends Provider<Component> implements HooksProvider {
    public typ = "comp";
    /**
     * Update shift effects
     */
    public _usefs: Array<() => (() => any) | undefined | void> = [];
    /**
     * Update effects
     */
    public _uefs: Array<() => (() => any) | undefined | void> = [];
    /**
     * Destroy effects
     */
    public _defs: Array<undefined | void | (() => void)> = [];
    /**
     * Hooks
     */
    public _hs?: HookInfo[];
    constructor(
        type: typeof Component,
        depth: number,
        key: string,
        index: number,
        container?: Provider | null,
        ref?: Ref,
        props: IObject<any> = {},
    ) {
        super(type, depth, key, index, container, ref, fillProps(props, type.defaultProps));
    }

    public s(nextProps: any, nextState: any) {
        const base = this.b;

        return base.shouldComponentUpdate(
            fillProps(nextProps, this.t.defaultProps),
            nextState || base.state,
        ) !== false;
    }

    public r(hooks: Function[], contexts: Record<string, Component>, prevProps: any) {
        const self = this;
        const type: any = self.t;
        self.ps = fillProps(self.ps, self.t.defaultProps);

        const props = self.ps;
        const isMount = !self.b;
        const contextType: Context = type.contextType;
        let base = self.b;
        const contextValue = contextType?.get(self);

        self._cs = contexts;
        if (isMount) {
            base = createComponent(type, props, contextValue, self);
            self.b = base;
        } else {
            base.props = props;
            base.context = contextValue;
        }
        const prevState = base.state;

        self._usefs = [];
        self._uefs = [];
        const template = base.render();

        if (template?.props?.children?.length === 0) {
            template.props.children = self.ps.children;
        }
        const nextContexts = { ...contexts, ...base.$_cs };

        renderProviders(
            self,
            self._ps,
            template ? [template] : [],
            hooks,
            nextContexts,
        );
        if (isMount) {
            self._uefs.push(() => {
                contextType?.register(self);
                base.componentDidMount();
            });
        } else {
            self._uefs.push(() => {
                base.componentDidUpdate(prevProps, prevState);
            });
        }
        hooks.push(() => {
            self._usefs.forEach(ef => {
                ef();
            });
            if (isMount) {
                self.md();
            } else {
                self.ud();
            }
            self._defs = self._uefs.map(ef => ef());
        });
    }
    public ss(nextState?: IObject<any>) {
        const base = this.b;

        if (!base || !nextState) {
            return;
        }
        base.state = nextState;
    }
    public un() {
        const self = this;
        self._ps.forEach(provider => {
            provider.un();
        });
        const type = self.t;
        (type.contextType as Context)?.unregister(self);
        clearTimeout(self.b.$_timer);

        self._defs.forEach(def => {
            def && def();
        });
        self.b.componentWillUnmount();
    }
}
