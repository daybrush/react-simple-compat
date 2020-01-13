interface CompatElement {
    type: any;
    key: any;
    props: {
        children: CompatElement[],
        [key: string]: any,
    },
}