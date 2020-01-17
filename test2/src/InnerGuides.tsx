import * as React from "react";
import * as ReactDOM from "react-dom";
import { ref } from "framework-utils";
import ReactGuides from "@scena/react-guides";
import { GuidesOptions } from "./types";

export default class InnerGuides extends React.Component<GuidesOptions, GuidesOptions> {
    public state: GuidesOptions = {};
    public preactGuides: ReactGuides;
    constructor(props: GuidesOptions) {
        super(props);
        this.state = this.props;
    }
    public render() {
        const { container, ...state } = this.state;

        window.a = this;
        return ReactDOM.createPortal(<div>
            <div className="hi" onClick={() => {
                console.log("hi");
            }}>div</div>
            <ReactGuides ref={ref(this, "preactGuides")} {...state} />
        </div>, container);
    }
    public render2() {
        const { container, ...state } = this.state;
        console.log("?");
        return ReactDOM.createPortal(<div>
            <div className="hi">div</div>
            <ReactGuides ref={ref(this, "preactGuides")} {...state} />
        </div>, container);
    }
}
