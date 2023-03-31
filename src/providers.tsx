import { isString } from "@daybrush/utils";
import { diff } from "@egjs/list-differ";
import { Provider } from "./base/Provider";
import { findDOMNode } from "./externalUtils";
import { createProvider } from "./renderProviders";
import { CompatElement } from "./types";
import { fillKeys, removeNode } from "./utils";


export class ContainerProvider extends Provider<any> {
    constructor(base: Element, depth: number) {
        super("container", depth, "container", 0, null);
        this.base = base;
    }
    public _render() {
        return true;
    }
    public _unmount() {
        return;
    }
}



export class TextProvider extends Provider<Node> {
    public _render(hooks: Function[]) {
        const isMount = !this.base;

        if (isMount) {
            this.base = document.createTextNode(this.type.replace("text_", ""));
        }
        hooks.push(() => {
            if (isMount) {
                this._mounted();
            } else {
                this._updated();
            }
        });
        return true;
    }
    public _unmount() {
        removeNode(this.base);
    }
}

export function diffProviders(
    containerProvider: Provider,
    providers: Provider[],
    children: Array<CompatElement | string>,
) {
    const childrenKeys = children.map(p => isString(p) ? null : p.key);
    const keys1 = fillKeys(providers.map(p => p.key));
    const keys2 = fillKeys(childrenKeys);
    const result = diff(keys1, keys2, key => key);

    result.removed.forEach(index => {
        providers.splice(index, 1)[0]._unmount();
    });
    result.ordered.forEach(([from, to]) => {
        const childrenProvider = providers.splice(from, 1)[0];

        providers.splice(to, 0, childrenProvider);

        const el = findDOMNode(childrenProvider.base);
        const next = findDOMNode(providers[to + 1] && providers[to + 1].base);

        if (el) {
            el.parentNode!.insertBefore(el, next);
        }
    });
    result.added.forEach(index => {
        providers.splice(index, 0, createProvider(children[index], childrenKeys[index], index, containerProvider));
    });
    const changed = result.maintained.filter(([_, to]) => {
        const el = children[to];
        const childProvider = providers[to];
        const type = isString(el) ? `text_${el}` : el.type;

        if (type !== childProvider.type) {
            childProvider._unmount();
            providers.splice(to, 1, createProvider(el, childrenKeys[to], to, containerProvider));
            return true;
        }
        childProvider.index = to;
        return false;
    });

    return [
        ...result.added,
        ...changed.map(([_, to]) => to),
    ];
}
