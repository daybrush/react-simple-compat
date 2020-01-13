
import { diff } from "@egjs/list-differ";

function diffObject(a: object, b: object) {
	for (let i in a) if (!(i in b)) return true;
	for (let i in b) if (a[i] !== b[i]) return true;
	return false;
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
export class Provider {
    key: string;
    base: Element | Component;
}
export class Component {
    props = {};
    state = {};
    public base!: Element | null;
    private _components = [];
    
}
export class PureComponent extends Component {
    shouldComponentUpdate(props, state) {
        return diffObject(this.props, props) || diffObject(this.state, state);
    }
}

export function render(element: any, container: Element, callback?: any) {

}