import { diff } from "@egjs/list-differ";
import { IObject, isUndefined, isString, isArray } from "@daybrush/utils";

function isDiff(a: object, b: object) {
    if (a === b) { return false; }
    for (const i in a) {
        if (!(i in b)) {
            return true;
        }
    }
    for (const i in b) {
        if (a[i] !== b[i]) {
            return true;
        }
    }
    return false;
}
function diffObject(a: object, b: object) {
    const keys1 = Object.keys(a);
    const keys2 = Object.keys(b);

    const result = diff(keys1, keys2, key => key);

    const added: IObject<any> = {};
    const removed: IObject<any> = {};
    const changed: IObject<any> = {};

    result.added.forEach(index => {
        const name = keys2[index];

        added[name] = b[name];
    });
    result.removed.forEach(index => {
        const name = keys1[index];

        removed[name] = a[name];
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
    };
}
function fillKeys(keys: any[]): string[] {
    let index = 0;

    return keys.map(key => key == null ? `$compat${++index}` : `${key}`);
}
function createProvider(el: CompatElement | string, key: string) {
    if (isString(el)) {
        return new TextProvider(`text_${el}`, key, null, {});
    }
    const providerClass
        = typeof el.type === "string"
        ? ElementProvider
        : el.type.prototype.render
        ? ComponentProvider
        : FunctionProvider;

    return new providerClass(
        el.type,
        key,
        el.ref,
        el.props,
    );
}
function flat(arr: any[]) {
    let arr2 = [];

    arr.forEach(el => {
        arr2 = arr2.concat(isArray(el) ? flat(el) : el);
    });

    return arr2;
}
function getAttributes(props: IObject<any>) {
    const { className, ...otherProps } = props;

    if (className != null) {
        otherProps.class = className;
    }
    delete otherProps.style;
    delete otherProps.children;
    return otherProps;
}
function fillProps(props: IObject<any>, defaultProps: IObject<any>) {
    if (!defaultProps) {
        return props;
    }
    for (const name in defaultProps) {
        if (isUndefined(props[name])) {
            props[name] = defaultProps[name];
        }
    }
    return props;
}
export function createElement(
    type: any,
    props: any = {},
    ...children: any[]
): CompatElement {
    const { key, ref, ...otherProps } = props;

    console.log(children, flat(children), flat(children).filter(child => child != null));
    return {
        type,
        key,
        ref,
        props: { ...otherProps, children: flat(children).filter(child => child != null) },
    };
}
export abstract class Provider<T extends Element | Component | Node = Element | Component | Node> {
    public base: T;
    public _providers: Array<Provider<any>> = [];
    constructor(
        public type: any,
        public key: string,
        public ref: (e: Element | Component | Node) => any,
        public props: IObject<any> = {},
    ) {}
    public abstract _render(prevProps: any, nextState: any, hooks: Function[]);
    public abstract _unmount();
    public _should(nextProps: any, nextState: any): boolean {
        return true;
    }
    public _update(nextElement: CompatElement | string, nextState: any, hooks: Function[]) {
        // render
        const prevProps = this.props;

        if (!isString(nextElement)) {
            this.props = nextElement.props;
            this.ref = nextElement.ref;
        }
        this._render(this.base ? prevProps : {}, nextState, hooks);
    }
    public _mounted() {
        const ref = this.ref;
        ref && ref(this.base);
    }
    public _updated() {
        const ref = this.ref;
        ref && ref(this.base);
    }
    public _destroy() {
        const ref = this.ref;
        ref && ref(null);
    }
}
function diffAttributes(attrs1: IObject<any>, attrs2: IObject<any>, el: Element) {
    const { added, removed, changed } = diffObject(attrs1, attrs2);
    for (const name in added) {
        el.setAttribute(name, added[name]);
    }
    for (const name in changed) {
        el.setAttribute(name, changed[name][1]);
    }
    for (const name in removed) {
        el.removeAttribute(name);
    }
}
function diffStyle(style1: IObject<any>, style2: IObject<any>, el: HTMLElement | SVGElement) {
    const style = el.style;
    const { added, removed, changed } = diffObject(style1, style2);

    for (const name in added) {
        style[name] = added[name];
    }
    for (const name in changed) {
        style[name] = changed[name][1];
    }
    for (const name in removed) {
        style[name] = "";
    }
}
export class TextProvider extends Provider<Node> {
    public _render(_1, _2, hooks: Function[]) {
        const isMount = !this.base;

        if (isMount) {
            this.base = document.createTextNode(this.type.replace("text_"));
        }
        hooks.push(() => {
            if (isMount) {
                this._mounted();
            } else {
                this._updated();
            }
        });
    }
    public _unmount() {
        this.base.parentNode.removeChild(this.base);
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

        diffAttributes(
            getAttributes(prevProps),
            getAttributes(this.props),
            base,
        );
        diffStyle(
            prevProps.style || {},
            this.props.style || {},
            base as HTMLElement,
        );

        hooks.push(() => {
            if (isMount) {
                this._mounted();
            } else {
                this._updated();
            }
        });
    }
    public _unmount() {
        this._providers.forEach(provider => {
            provider._unmount();
        });
        this.base.parentNode.removeChild(this.base);
    }
}
export function findDOMNode(comp: Component | Node | null): Node | null {
    if (!comp) {
        return null;
    }
    if (comp instanceof Node) {
        return comp;
    }
    const providers = comp._provider._providers;
    if (!providers.length) {
        return null;
    }
    return findDOMNode(providers[0].base);
}
export class FunctionProvider extends Provider<Component> {
    public _render() {
        const template = this.type(this.props);

        renderProviders(template ? [template] : [], this._providers);
    }
    public _unmount() {
        this._providers.forEach(provider => {
            provider._unmount();
        });
    }
}
export class ComponentProvider extends Provider<Component> {
    constructor(
        type: typeof Component,
        key: string,
        ref: (e: Element | Component | Node) => any,
        props: IObject<any> = {},
    ) {
        super(type, key, ref, fillProps(props, type.defaultProps));
    }
    public _should(nextProps: any, nextState: any) {
        return this.base.shouldComponentUpdate(
            fillProps(nextProps, this.type.defaultProps),
            nextState || this.base.state,
        );
    }
    public _render(prevProps, nextState, hooks: Function[]) {
        this.props = fillProps(this.props, this.type.defaultProps);
        const isMount = !this.base;

        if (isMount) {
            this.base = new this.type(this.props);
            this.base._provider = this;
        }
        const base = this.base;
        const prevState = base.state;
        base.state = nextState || prevState;
        const template = base.render();

        console.log(template);
        renderProviders(template ? [template] : [], this._providers);

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
    public _unmount() {
        this._providers.forEach(provider => {
            provider._unmount();
        });
        this.base.componentWillUnmount();
    }
}
export class Component {
    public static defaultProps?: IObject<any>;
    public _provider: Provider;
    public state: IObject<any> = {};
    constructor(public props: IObject<any> = {}) {}
    public shouldComponentUpdate(props?: any, state?: any): boolean {
        return true;
    }
    public render() {
        return null;
    }
    public componentDidMount() {}
    public componentDidUpdate(prevProps, prevState) { }
    public componentWillUnmount() { }

}
export class PureComponent extends Component {
    public shouldComponentUpdate(props?, state?) {
        return isDiff(this.props, props) || isDiff(this.state, state);
    }
}
class _Portal extends PureComponent {
    public componentDidMount() {
        const { element, container } = this.props;

        render(element, container, () => {}, true);
    }
    public componentDidUpdate() {
        const { element, container } = this.props;

        render(element, container, () => {}, true);
    }
    public componentWillUnmount() {
        const { container } = this.props;

        render(null, container);
    }
}

export function renderProviders(
    children: Array<CompatElement | string>,
    providers: Provider[],
    nextState?: any,
    container?: Element,
) {
    const keys1 = fillKeys(providers.map(p => p.key));
    const keys2 = fillKeys(children.map(p => isString(p) ? null : p.key));

    console.log(providers.map(p => [p.type, p.key, p.props.className]), children);
    const result = diff(keys1, keys2, key => key);
    const updatedHooks: Function[] = [];

    result.removed.forEach(index => {
        providers.splice(index, 1)[0]._unmount();
    });
    result.ordered.forEach(([from, to]) => {
        const childrenProvider = providers.splice(from, 1)[0];

        providers.splice(to, 0, childrenProvider);

        const el = findDOMNode(childrenProvider.base);
        const next = findDOMNode(providers[to] && providers[to].base);

        if (el) {
            el.parentNode.insertBefore(el, next);
        }
    });
    result.added.forEach(index => {
        providers.push(createProvider(children[index], keys2[index]));
    });
    result.maintained.forEach(([_, to]) => {
        const el = children[to];
        const childProvider = providers[to];
        const type = isString(el) ? `text_${el}` : el.type;

        if (type !== childProvider.type) {
            childProvider._unmount();
        }
        providers.splice(to, 1, createProvider(el, keys2[to]));
    });
    providers.forEach((childProvider, i) => {
        const el = children[i];

        if (!isString(el)) {
            if (childProvider.base && !childProvider._should(el.props, nextState)) {
                return;
            }
            renderProviders(el.props.children, childProvider._providers);
        }
        childProvider._update(el, nextState, updatedHooks);
    });
    if (container && result.added.length && providers[0]) {
        const pv = providers[0];
        const rel = findDOMNode(pv.base);

        if (rel) {
            (rel as any).__REACT_COMPAT__ = pv;
        }

        if (rel) {
            container.appendChild(rel);
        }
    }
    updatedHooks.forEach(func => {
        func();
    });
}
export function render(element: any, container: Element, callback?: Function, isNotClear?: boolean) {
    const provider = (container as any).__REACT_COMPAT__;

    if (element && !provider && !isNotClear) {
        container.innerHTML = "";
    }
    const providers = provider ? [provider] : [];

    renderProviders(element ? [element] : null, providers, null, container);
    callback && callback();
}

export function createPortal(el: any, container: Element) {
    return <_Portal element={el} container={container} />;
}
