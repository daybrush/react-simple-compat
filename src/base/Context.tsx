import { Context } from "../types";
import { Component } from "./Component";

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

    const context = {
        $_id: id,
        $_dv: defaultValue,
        Consumer,
        Provider: Provider,
    };

    Consumer.contextType = context;

    return context;
}
