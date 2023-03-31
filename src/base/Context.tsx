import { Context } from "../types";
import { Component } from "./Component";

let i/*#__PURE__*/ = 0;

export function createContext(defaultValue?: any): Context {
    const id = `c${++i}`;

    function Provider(this: Component, props: any) {
        if (!this.$_cs[id]) {
            this.$_cs[id] = this;
            const $_subs = [];

            this.shouldComponentUpdate = (nextProps) => {
                if (nextProps.value !== this.props.value) {
                    // request
                    this.$_req = true;
                }
            }
            this.render = () => {
                return this.props.children[0];
            };
            this.$_subs = $_subs;
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
