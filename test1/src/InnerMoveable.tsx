import * as React from "react";
import { createPortal } from "react-dom";
import Moveable, { MoveableProps } from "react-moveable";
import { ref } from "framework-utils";

export default class InnerMoveable extends React.Component<MoveableProps> {
    public state: MoveableProps = {};
    public preactMoveable: any;
    constructor(props: MoveableProps) {
        super(props);
        this.state = this.props;
    }
    public render() {
        return createPortal(<Moveable ref={ref(this, "preactMoveable")} {...this.state} />, this.state.parentElement);
    }
}
