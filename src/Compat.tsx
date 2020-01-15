import { diff } from "@egjs/list-differ";
import { IObject, isUndefined, isString, isArray, find } from "@daybrush/utils";

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
        const values = [a[name], b[name]];

        if (a[name] !== b[name]) {
            changed[name] = values;
        }
    });
    return {
        added,
        removed,
        changed,
    };
}
function executeHooks(hooks: Function[]) {
    hooks.forEach(hook => {
        hook();
    });
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

    return {
        type,
        key,
        ref,
        props: { ...otherProps, children: flat(children).filter(child => child != null) },
    };
}
export abstract class Provider<T extends Element | Component | Node = Element | Component | Node> {
    public original: CompatElement | string;
    public base: T;
    public _providers: Array<Provider<any>> = [];

    constructor(
        public type: any,
        public key: string,
        public ref: (e: Element | Component | Node) => any,
        public props: IObject<any> = {},
    ) {}
    public abstract _render(hooks: Function[], prevProps: any, nextState: any);
    public abstract _unmount();
    public _should(nextProps: any, nextState: any): boolean {
        return true;
    }
    public _update(
        hooks: Function[],
        nextElement: CompatElement | string,
        nextState?: any,
        isForceUpdate?: boolean,
    ) {
        if (
            this.base
            && !isString(nextElement)
            && !isForceUpdate
            && !this._should(nextElement.props, nextState)
        ) {
            return false;
        }
        this.original = nextElement;
        this._setState(nextState);
        // render
        const prevProps = this.props;

        if (!isString(nextElement)) {
            this.props = nextElement.props;
            this.ref = nextElement.ref;
        }
        this._render(hooks, this.base ? prevProps : {}, nextState);
        return true;
    }
    public _mounted() {
        const ref = this.ref;
        ref && ref(this.base);
    }
    public _setState(nextstate: IObject<any>) {
        return;
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
    public _render(hooks: Function[]) {
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
        return true;
    }
    public _unmount() {
        this.base.parentNode.removeChild(this.base);
    }
}
export class ElementProvider extends Provider<Element> {
    public _should(nextProps: any) {
        return isDiff(this.props, nextProps);
    }
    public _render(hooks: Function[], prevProps) {
        const isMount = !this.base;

        if (isMount) {
            this.base = document.createElement(this.type);
        }
        renderProviders(this.props.children, this._providers, hooks, null, this.base);
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
        return true;
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
    public _render(hooks: Function[]) {
        const template = this.type(this.props);

        renderProviders(template ? [template] : [], this._providers, hooks);
        return true;
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
    public _render(hooks: Function[], prevProps, nextState) {
        this.props = fillProps(this.props, this.type.defaultProps);
        const isMount = !this.base;

        if (isMount) {
            this.base = new this.type(this.props);
            this.base._provider = this;
        } else {
            this.base.props = this.props;
        }
        const base = this.base;
        const prevState = base.state;
        const template = base.render();

        if (template && template.props && !template.props.children.length) {
            template.props.children = this.props.children;
        }
        renderProviders(
            template ? [template] : [],
            this._providers, hooks, nextState,
            null,
        );
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
    public _setState(nextState?: IObject<any>) {
        if (!nextState) {
            return;
        }
        const base = this.base;
        base.state = nextState;
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
    public _provider: ComponentProvider;
    public state: IObject<any> = {};
    constructor(public props: IObject<any> = {}) {}
    public shouldComponentUpdate(props?: any, state?: any): boolean {
        return true;
    }
    public render() {
        return null;
    }
    public setState(state: IObject<any>, callback?: Function, isForceUpdate?: boolean) {
        const hooks: Function[] = [];
        const provider = this._provider;

        const isUpdate = renderProviders(
            [provider.original],
            [provider],
            hooks,
            {...this.state, ...state},
            null,
            isForceUpdate,
        );

        if (isUpdate) {
            if (callback) {
                hooks.push(callback);
            }
            executeHooks(hooks);
        }
    }
    public forceUpdate(callback?: Function) {
        this.setState(this.state, callback, true);
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
    public _portalProvider: Provider;
    public componentDidMount() {
        const { element, container } = this.props;

        this._portalProvider = renderProvider(element, container);
    }
    public componentDidUpdate() {
        const { element, container } = this.props;

        this._portalProvider = renderProvider(element, container);
    }
    public componentWillUnmount() {
        const { container } = this.props;

        this._portalProvider = null;
        renderProvider(null, container);
    }
}
function updateProviders(
    children: Array<CompatElement | string>,
    providers: Provider[],
    nextState?: any,
    container?: Element,
) {
    const hooks: Function[] = [];
    renderProviders(
        children,
        providers,
        hooks,
        nextState,
        container,
    );
    executeHooks(hooks);
}
export function renderProviders(
    children: Array<CompatElement | string>,
    providers: Provider[],
    updatedHooks: Function[],
    nextState?: any,
    container?: Element,
    isForceUpdate?: boolean,
) {
    const keys1 = fillKeys(providers.map(p => p.key));
    const keys2 = fillKeys(children.map(p => isString(p) ? null : p.key));
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
            el.parentNode.insertBefore(el, next);
        }
    });
    result.added.forEach(index => {
        providers.splice(index, 0, createProvider(children[index], keys2[index]));
    });
    result.maintained.forEach(([_, to]) => {
        const el = children[to];
        const childProvider = providers[to];
        const type = isString(el) ? `text_${el}` : el.type;

        if (type !== childProvider.type) {
            childProvider._unmount();
            providers.splice(to, 1, createProvider(el, keys2[to]));
        }
    });
    const updated = providers.filter((childProvider, i) => {
        const el = children[i];

        return childProvider._update(updatedHooks, el, nextState, isForceUpdate);
    });
    if (container) {
        result.added.forEach(index => {
            const el = findDOMNode(providers[index].base);

            if (!el) {
                return;
            }
            const nextProvider = providers[index + 1];
            if (container !== el && !el.parentNode) {

                const nextElement = findDOMNode(nextProvider && nextProvider.base);
                container.insertBefore(el, nextElement && nextElement.parentNode ? nextElement : null);
            }
        });
    }
    return updated.length > 0;
}
export function renderProvider(
    element: any,
    container: Element,
    provider: Provider = (container as any).__REACT_COMPAT__,
) {
    const providers = provider ? [provider] : [];

    updateProviders(element ? [element] : [], providers, null, container);

    provider = providers[0];
    (container as any).__REACT_COMPAT__ = provider;
    return provider;
}
export function render(element: any, container: Element, callback?: Function) {
    const provider = (container as any).__REACT_COMPAT__;
    if (element && !provider) {
        container.innerHTML = "";
    }
    renderProvider(element, container, provider);
    callback && callback();
}

export function createPortal(el: any, container: Element) {
    return <_Portal element={el} container={container} />;
}
