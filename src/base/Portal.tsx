import { createElement } from "../externalUtils";
import { ContainerProvider } from "../providers";
import { renderProvider } from "../renderProviders";
import { PureComponent } from "./Component";
import { Provider } from "./Provider";

class Portal extends PureComponent {
    /**
     * portal provider
     */
    public _pp!: Provider | null;
    public componentDidMount() {
        const { element, container } = this.props;

        const parentProvider = this.$_p;
        this._pp = new ContainerProvider(container, parentProvider.depth + 1);

        renderProvider(element, container, this._pp, parentProvider._cs);
    }
    public componentDidUpdate() {
        const { element, container } = this.props;

        renderProvider(element, container, this._pp, this.$_p._cs);
    }
    public componentWillUnmount() {
        const { container } = this.props;

        renderProvider(null, container, this._pp, this.$_p._cs);
        this._pp = null;
    }
}


export function createPortal(el: any, container: Element) {
    return createElement(Portal, { element: el, container });
}
