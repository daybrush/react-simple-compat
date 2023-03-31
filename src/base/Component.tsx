import { IObject } from "@daybrush/utils";
import { renderProviders } from "../renderProviders";
import { Context } from "../types";
import { executeHooks, isDiff } from "../utils";
import { ComponentProvider } from "./ComponentProvider";
import { Provider, setCurrentInstance } from "./Provider";

export class Component {
    public static defaultProps?: IObject<any>;
    public static conextType?: Context;

    public state: IObject<any> = {};
    public $_p: ComponentProvider;
    public $_timer = 0;
    public $_state: IObject<any> = {};
    public $_req!: boolean;
    public $_subs: Provider[] = [];
    public $_cs: Record<string, Component> = {};

    constructor(public props: IObject<any> = {}, public context?: any) { }

    public render(): any {
        return null;
    }
    shouldComponentUpdate(props: Record<string, any>, state: Record<string, any>): boolean | void | undefined;
    shouldComponentUpdate(props, state) {
        return this.props !== props || this.state !== state;
    }
    public setState(state: IObject<any>, callback?: Function, isForceUpdate?: boolean) {
        if (!this.$_timer) {
            this.$_state = {};
        }
        clearTimeout(this.$_timer);

        this.$_timer = 0;
        this.$_state = { ...this.$_state, ...state };

        if (!isForceUpdate) {
            this.$_timer = window.setTimeout(() => {
                this.$_timer = 0;
                this.$_setState(callback, isForceUpdate);
            });
        } else {
            this.$_setState(callback, isForceUpdate);
        }
        return;
    }
    public forceUpdate(callback?: Function) {
        this.setState({}, callback, true);
    }
    public componentDidMount() { }
    public componentDidUpdate(prevProps: Record<string, any>, prevState: Record<string, any>): void;
    public componentDidUpdate(prevProps, prevState) { }
    public componentWillUnmount() { }
    private $_setState(callback?: Function, isForceUpdate?: boolean) {
        const hooks: Function[] = [];
        const provider = this.$_p;
        const isUpdate = renderProviders(
            provider.container!,
            [provider],
            [provider.original],
            hooks,
            provider._cs,
            { ...this.state, ...this.$_state },
            isForceUpdate,
        );
        if (isUpdate) {
            if (callback) {
                hooks.push(callback);
            }
            executeHooks(hooks);
            setCurrentInstance(null);
        }
    }
}
export class PureComponent extends Component {
    public shouldComponentUpdate(props?, state?) {
        return isDiff(this.props, props) || isDiff(this.state, state);
    }
}
