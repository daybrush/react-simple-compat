import { findIndex, pushSet } from "@daybrush/utils";
import { Context } from "../types";
import { Component } from "./Component";
import { Provider } from "./Provider";

let i/*#__PURE__*/ = 0;

export function createContext(defaultValue?: any): Context {
    const id = `c${++i}`;

    function Provider(this: Component, props: any) {
        const self = this;
        if (!self.$_cs[id]) {
            self.$_cs[id] = self;
            const $_subs = [];

            self.shouldComponentUpdate = (nextProps) => {
                if (nextProps.value !== self.props.value) {
                    // request
                    self.$_req = true;
                }
            }
            self.render = () => {
                return self.props.children[0];
            };
            self.$_subs = $_subs;
        }
        return props.children[0];
    }
    function Consumer(props, contextValue) {
        return props.children(contextValue);
    }

    function getContext(provider: Provider) {
        return provider._cs[id];
    }
    const context = {
        $_id: id,
        $_dv: defaultValue,
        Consumer,
        Provider: Provider,
        get(provider: Provider) {
            return getContext(provider)?.props.value ?? defaultValue;
        },
        register(provider: Provider) {
            const mainComponent = getContext(provider);

            if (mainComponent) {
                pushSet(mainComponent.$_subs, provider);
            }
        },
        unregister(provider: Provider) {
            const mainComponent = getContext(provider);

            if (mainComponent) {
                const subs = mainComponent.$_subs;
                const index = subs.indexOf(provider);

                if (index > -1) {
                    subs.splice(index, 1);
                }
            }
        },
    };

    Consumer.contextType = context;

    return context;
}
