import { diff } from "@egjs/list-differ";
import { IObject } from "@daybrush/utils";

function isDiff(a: object, b: object) {
    if (a === b) return false;
	for (let i in a) if (!(i in b)) return true;
	for (let i in b) if (a[i] !== b[i]) return true;
	return false;
}
function diffObject(a: object, b: object) {
    const keys1 = Object.keys(a);
    const keys2 = Object.keys(b);
    const result = diff(keys2, keys2, key => key);

    const added: IObject<any> = {};
    const removed: IObject<any> = {};
    const changed: IObject<any> = {};

    result.added.forEach(index => {
        const name = keys2[index];

        added[name] = b[index];
    });
    result.removed.forEach(index => {
        const name = keys1[index];

        removed[name] = a[index];
    });
    result.maintained.forEach(([index]) => {
        const name = keys1[index];

        if (a[name] !== b[name]) {
            changed[name] = [a[name], b[name]];
        }
    });
    return {
        added,
        removed,
        changed,
    }
}
function fillKeys(keys: any[]): string[] {
    let index = 0;

    return keys.map(key => `${key}` || `$compat${index}`);
}
function diffChildren(elements1: CompatElement[], elements2: CompatElement[], container: Component) {
    const keys1 = fillKeys(elements1.map(({ key }) => key));
    const keys2 = fillKeys(elements2.map(({ key }) => key));
    const result = diff(keys1, keys2, key => key);

}

export function createElement(
    type: any,
    props: any = {},
    ...children: any[]
): CompatElement {
    const { key, ...otherProps } = props;
    return {
        type,
        key,
        props: {...otherProps, children },
    };
}
export abstract class Provider<T extends Element | Component | Node = Element | Component | Node> {
    type: any;
    key: string;
    ref: (e: Element | Component | Node) => any;
    base: T;
    props = {};
    _providers: Provider<any>[] = [];
    abstract _should(nextProps: any, nextState: any): boolean;
    abstract _render(prevProps: any, nextState: any, hooks: Function[]);
    public _update(nextProps: any, nextState: any, hooks: Function[]) {
        // shouldComponentUpdate
        if (!this._should(nextProps, nextState)) {
            return;
        }
        // render
        const prevProps = this.props;
        this.props = nextProps;
        this._render(prevProps, nextState, hooks);
    }
    public _mounted() {
        this.ref(this.base);
    }
    public _updated() {
        this.ref(this.base);
    }
    public _destroy() {
        this.ref(null);
    }
}
export class ElementProvider extends Provider<Element> {
    public _should(nextProps: any) {
        return isDiff(this.props, nextProps);
    }
    public _render(prevProps, _, hooks: Function[]) {
        const isMount = !this.base;

        if (isMount) {
            this.base = document.createElement(this.type);
        }
        const base = this.base;
        const { added, changed, removed } = diffObject(prevProps, this.props);

        for (const name in added) {
            base.setAttribute(name, added[name]);
        }
        for (const name in changed) {
            base.setAttribute(name, changed[name][1]);
        }
        for (const name in removed) {
            base.removeAttribute(name);
        }
        hooks.push(() => {
            if (isMount) {
                this._mounted();
            } else {
                this._updated();
            }
        });
    }
}
export class ComponentProvider extends Provider<Component> {
    public _should(nextProps: any, nextState: any) {
        return this.base.shouldComponentUpdate(nextProps, nextState);
    }
    public _render(prevProps, nextState, hooks: Function[]) {
        const isMount = !this.base;

        if (isMount) {
            this.base = new this.type(this.props);
        }
        const base = this.base;
        const prevState = base.state;
        base.state = nextState;
        const template = base.render();

        hooks.push(() => {
            if (isMount) {
                this._mounted();
                base.componentDidMount();
            } else {
                this._updated();
                base.componentDidUpdate(prevProps, prevState);
            }
        });
    }
}
export class Component {
    _provider: Provider;
    props = {};
    state = {};
    public shouldComponentUpdate(props?: any, state?: any): boolean {
        return true;
    }
    public render() {
        return null;
    }
    public componentDidMount() {}
    public componentDidUpdate(prevProps, prevState) {}

}
export class PureComponent extends Component {
    public shouldComponentUpdate(props?, state?) {
        return isDiff(this.props, props) || isDiff(this.state, state);
    }
}

export function render(element: any, container: Element, callback?: any) {

}
