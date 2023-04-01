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
        const self = this;
        const { element, container } = self.props;

        const parentProvider = self.$_p;
        self._pp = new ContainerProvider(container, parentProvider.d + 1);

        renderProvider(element, container, self._pp, parentProvider._cs);
    }
    public componentDidUpdate() {
        const self = this;
        const { element, container } = self.props;

        renderProvider(element, container, self._pp, self.$_p._cs);
    }
    public componentWillUnmount() {
        const self = this;
        const { container } = self.props;

        renderProvider(null, container, self._pp, self.$_p._cs);
        this._pp = null;
    }
}


export function createPortal(el: any, container: Element) {
    return createElement(Portal, { element: el, container });
}
