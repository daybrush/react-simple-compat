import { findIndex, IObject } from "@daybrush/utils";
import { renderProviders } from "../renderProviders";
import { Context } from "../types";
import { fillProps, renderFunctionComponent } from "../utils";
import { Component } from "./Component";
import { Provider } from "./Provider";

export class ComponentProvider extends Provider<Component> {
    constructor(
        type: typeof Component,
        depth: number,
        key: string,
        index: number,
        container?: Provider | null,
        ref?: (e: Element | Component | Node | null) => any,
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
        let base = self.b;
        const isMount = !self.b;


        self._cs = contexts;

        const contextType: Context = type.contextType;
        let contextValue!: any;
        let providerComponent!: Component;

        if (contextType) {
            const contextId = contextType.$_id;

            if (contextId in contexts) {
                providerComponent = contexts[contextId];
                contextValue = providerComponent.props.value;
            } else {
                contextValue = contextType.$_dv;
            }
        }
        if (isMount) {
            if (providerComponent) {
                providerComponent.$_subs.push(self);
            }
            if ("prototype" in type && type.prototype.render) {
                base = new type(self.ps, contextValue);
            } else {
                base = new Component(props, contextValue);
                base.constructor = type;
                base.render = renderFunctionComponent;
            }
            base.$_p = self;

            self.b = base;
        } else {
            base.props = props;
            base.context = contextValue;
        }
        const prevState = base.state;
        const template = base.render();

        if (template && template.props && !template.props.children.length) {
            template.props.children = self.ps.children;
        }
        const nextContexts = {...contexts, ...base.$_cs };

        renderProviders(
            self,
            self._ps,
            template ? [template] : [],
            hooks,
            nextContexts,
        );
        hooks.push(() => {
            if (isMount) {
                self.md();
                base.componentDidMount();
            } else {
                self.ud();
                base.componentDidUpdate(prevProps, prevState);
            }
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
            provider.ud();
        });
        const contexts = self._cs;
        const type = self.t;
        const contextType = type.contextType;

        if (contextType) {
            const context = contexts[contextType];

            if (context) {
                const subs = context.$_subs;
                const index = findIndex(subs, sub => sub === self);

                if (index > -1) {
                    subs.splice(index, 1);
                }
            }
        }
        clearTimeout(self.b.$_timer);
        self.b.componentWillUnmount();
    }
}
