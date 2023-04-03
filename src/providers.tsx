import { isString } from "@daybrush/utils";
import { diff } from "@egjs/list-differ";
import { Provider } from "./base/Provider";
import { findDOMNode } from "./externalUtils";
import { createProvider } from "./renderProviders";
import { CompatElement } from "./types";
import { fillKeys, removeNode } from "./utils";


export class ContainerProvider extends Provider<any> {
    public typ = "container";
    constructor(base: Element, depth = 0) {
        super("container", depth, "container", 0, null);
        this.b = base;
    }
    public r() {
        return true;
    }
    public un() {
        return;
    }
}



export class TextProvider extends Provider<Node> {
    public typ = "text";
    public r(hooks: Function[]) {
        const self = this;
        const isMount = !self.b;

        if (isMount) {
            const b = self._hyd?.splice(0, 1)[0];

            self.b = b || document.createTextNode(self.t.replace("text_", ""));
        }
        hooks.push(() => {
            if (isMount) {
                self.md();
            } else {
                self.ud();
            }
        });
        return true;
    }
    public un() {
        removeNode(this.b);
    }
}

export function diffProviders(
    containerProvider: Provider,
    providers: Provider[],
    children: Array<CompatElement | string>,
) {
    const childrenKeys = children.map(p => isString(p) ? null : p.key);
    const keys1 = fillKeys(providers.map(p => p.k));
    const keys2 = fillKeys(childrenKeys);
    const result = diff(keys1, keys2, key => key);

    result.removed.forEach(index => {
        providers.splice(index, 1)[0].un();
    });
    result.ordered.forEach(([from, to]) => {
        const childrenProvider = providers.splice(from, 1)[0];

        providers.splice(to, 0, childrenProvider);

        const el = findDOMNode(childrenProvider.b);
        const next = findDOMNode(providers[to + 1] && providers[to + 1].b);

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

        if (type !== childProvider.t) {
            childProvider.un();
            providers.splice(to, 1, createProvider(el, childrenKeys[to], to, containerProvider));
            return true;
        }
        childProvider.i = to;
        return false;
    });

    return [
        ...result.added,
        ...changed.map(([_, to]) => to),
    ];
}
