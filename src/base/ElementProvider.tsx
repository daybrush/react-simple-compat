import { addEvent, decamelize, getKeys, removeEvent } from "@daybrush/utils";
import { diff } from "@egjs/list-differ";
import { renderProviders } from "../renderProviders";
import { isDiff, splitProps, getAttributes, findContainerNode, removeNode } from "../utils";
import { Component } from "./Component";
import { Provider } from "./Provider";


function diffAttributes(attrs1: Record<string, any>, attrs2: Record<string, any>, el: Element) {
    const { added, removed, changed } = diffObject(getAttributes(attrs1), getAttributes(attrs2));
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

function diffEvents(
    events1: Record<string, any>,
    events2: Record<string, any>,
    provier: ElementProvider,
) {
    const { added, removed } = diffObject(events1, events2);

    for (const name in removed) {
        provier.e(name, true);
    }
    for (const name in added) {
        provier.e(name);
    }
}

function diffObject(a: object, b: object) {
    const keys1 = getKeys(a);
    const keys2 = getKeys(b);

    const result = diff(keys1, keys2, key => key);

    const added: Record<string, any> = {};
    const removed: Record<string, any> = {};
    const changed: Record<string, any> = {};

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

function diffStyle(style1: Record<string, any>, style2: Record<string, any>, el: HTMLElement | SVGElement) {
    const style = el.style;
    const { added, removed, changed } = diffObject(style1, style2);

    for (const beforeName in added) {
        const name = decamelize(beforeName, "-");

        style.setProperty(name, added[beforeName]);
    }
    for (const beforeName in changed) {
        const name = decamelize(beforeName, "-");

        style.setProperty(name, changed[beforeName][1]);
    }
    for (const beforeName in removed) {
        const name = decamelize(beforeName, "-");

        style.removeProperty(name);
    }
}

function getNativeEventName(name: string) {
    return name.replace(/^on/g, "").toLowerCase();
}

export class ElementProvider extends Provider<Element> {
    public typ = "elem";
    /**
     * Events
     */
    private _es: Record<string, Function> = {};
    /**
     * is svg
     */
    public _svg = false;
    public e(name: string, isRemove?: boolean) {
        const self = this;
        const events = self._es;
        const base = self.b;
        const eventName = getNativeEventName(name);

        if (isRemove) {
            removeEvent(
                base,
                eventName,
                events[name] as any,
            );
            delete events[name];
        } else {
            events[name] = (e: Event) => {
                self.ps[name]?.(e);
            };
            addEvent(
                base,
                eventName,
                events[name] as any,
            );
        }
    }
    public s(nextProps: any) {
        return isDiff(this.ps, nextProps);
    }
    public r(hooks: Function[], contextValues: Record<string, Component>, prevProps: any) {
        const self = this;
        const isMount = !self.b;
        const nextProps = self.ps;

        if (isMount) {
            let isSVG = false;

            if (self._svg || self.t === "svg") {
                isSVG = true;
            } else {
                const containerNode = findContainerNode(self.c);

                isSVG = containerNode && (containerNode as any).ownerSVGElement;
            }

            self._svg = isSVG!;

            let element = nextProps.portalContainer;

            if (!element) {
                element = self._hyd?.splice(0, 1)[0];

                const type = self.t;

                if (element) {
                    self._hyd = [].slice.call(element.children);
                } else {
                    if (isSVG) {
                        element = document.createElementNS("http://www.w3.org/2000/svg", type);
                    } else {
                        element = document.createElement(type);
                    }
                }
            }
            self.b = element;
        }


        renderProviders(self, self._ps, nextProps.children, hooks, contextValues);
        const base = self.b;

        const [
            prevAttributes,
            prevEvents,
        ] = splitProps(prevProps);
        const [
            nextAttributes,
            nextEvents,
        ] = splitProps(nextProps);

        diffAttributes(
            prevAttributes,
            nextAttributes,
            base,
        );
        diffEvents(
            prevEvents,
            nextEvents,
            self,
        );
        diffStyle(
            prevProps.style || {},
            nextProps.style || {},
            base as HTMLElement,
        );
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
        const self = this;
        const events = self._es;
        const base = self.b;

        for (const name in events) {
            removeEvent(base, name, events[name] as any);
        }
        self._ps.forEach(provider => {
            provider.un();
        });
        self._es = {};

        if (!self.ps.portalContainer && !self._sel) {
            removeNode(base);
        }
    }
}
