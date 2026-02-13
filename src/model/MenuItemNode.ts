export type MenuItemNodeConstructor = {
    id: string;
    parent?: MenuItemNode | string | null;
    children?: Iterable<MenuItemNode | string> | MenuItemNode | string | null;
};

export type MenuItemNodePOD = {
    id: string;
    children?: MenuItemNodePOD[];
};

export class MenuItemNode {

    id: string;

    parent: MenuItemNode | null;

    readonly children = new Set<MenuItemNode>();

    constructor(
        {
            id,
            parent = null,
            children
        }: MenuItemNodeConstructor
    ) {
        this.id = id;

        if (typeof parent === "string") {
            this.parent = new MenuItemNode({ id: parent });
        }
        else if (parent instanceof MenuItemNode) {
            this.parent = parent;
        }
        else {
            this.parent = null;
        }

        if (children instanceof Set) {
            this.addChildren(children);
        }
        else if (children instanceof MenuItemNode) {
            this.addChild(children);
        }
        else if (typeof children === "string") {
            this.addChild(new MenuItemNode({ id: children }));
        }

        if (this.parent) {
            this.parent.children.add(this);
        }
    }

    addChildren(children: Iterable<MenuItemNode | string>): void {
        for (const child of children) {
            this.addChild(child);
        }
    }

    addChild(child: MenuItemNode | string): void {
        let childNode: MenuItemNode;
        if (typeof child === "string") {
            childNode = new MenuItemNode({ id: child });
        }
        else {
            childNode = child;
        }
        childNode.parent = this;
        this.children.add(childNode);
    }

    /**
     * Checks if this node has a specified child node, or if this node is the
     * child itself.
     *
     * @param child - The child node or node ID to search for.
     * @returns `true` if this node has the child or is the child; `false`
     * otherwise.
     */
    hasChild(child: MenuItemNode | string): boolean {

        const childID = typeof child === "string" ? child : child.id;

        if (this.id === childID) {
            return true;
        }
        for (const child of this.children) {
            if (child.hasChild(childID)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Checks if the given node has a child, or if the node is the child itself.
     *
     * @param node - The node or node ID to search within.
     * @param child - The child node or node ID to search for in `node`.
     * @returns `true` if the node has the child or is the child; `false`
     * otherwise.
     */
    nodeHasChild(
        node: MenuItemNode | string,
        child: MenuItemNode | string
    ): boolean {

        const resolvedNode = typeof node === "string"
            ? this.getNodeByID(node)
            : node;

        if (!resolvedNode) {
            return false;
        }

        return resolvedNode.hasChild(child);
    }

    /**
     * Returns the node with the given ID, or null if not found.
     */
    getNodeByID(nodeID: string): MenuItemNode | null {
        if (this.id === nodeID) {
            return this;
        }
        for (const child of this.children) {
            const node = child.getNodeByID(nodeID);
            if (node) {
                return node;
            }
        }
        return null;
    }

    /**
     * Builds a tree ending at the specified child node. The root of the tree is
     * the receiver of this method.
     *
     * @param childID - The ID of the child node at which the tree should end.
     * @returns The root node of the tree, or null if the child node is not a
     * descendant of this node.
     */
    buildTreeEndingAtChild(
        childID: string
    ): MenuItemNode | null {

        // The root of the tree is the receiver of this method. We will build a
        // *new* tree starting from the current node. We do not want to modify
        // the original tree, so we create a new node for the root.
        const tree = new MenuItemNode({
            id: this.id
        });

        if (this.id === childID) {
            // we must return a new, detached node for the root of the
            // subtree, because we do not want to return descendants of this
            // node
            return tree;
        }

        for (const childNode of this.children) {
            // Check if this node contains the child node with the specified ID
            // as a direct child.
            if (childNode.id === childID) {
                // We only want to add the direct child node that has the
                // specified childID, not its children, so we create a new node
                // for the child and add it to the tree.
                const detachedChildNode = new MenuItemNode({
                    id: childNode.id
                });
                tree.addChild(detachedChildNode);
                return tree;
            }

            // If the child node is not a direct child of this node, we
            // recursively, build the subtree starting from this child node.
            const subtree = childNode.buildTreeEndingAtChild(childID);
            if (subtree) {
                tree.addChild(subtree);
                return tree;
            }

        }

        // If we reach this point, it means this node has no children or the
        // child node with the specified ID is not a descendant of this node.
        return null;
    }

    /**
     * Returns the path from this node to the specified child node, or an empty
     * array if the child node is not found.
     *
     * If this node is the child node, the path will contain only this node's
     * ID.
     *
     * @param childID - The ID of the child node to find.
     * @returns An array of IDs representing the path from this node to the
     * specified child node. If the child node is not found, an empty array is
     * returned.
     */
    pathToChild(
        childID: string
    ): string[] {

        if (this.id === childID) {
            return [this.id];
        }
        for (const child of this.children) {
            if (child.id === childID) {
                // We found the child, so append it to the path and return the
                // path.
                return [this.id, childID];
            }
            else {
                // Recursively search for the child in the subtree.
                const childPath = child.pathToChild(childID);
                // If the child was found in the subtree, append the current
                // node's ID to the path, followed by the child path, and return
                // the path.
                if (childPath.length > 0) {
                    return [this.id, ...childPath];
                }
            }
        }

        // If we reach this point, it means the child node was not found in
        // this node or any of its children, so we return an empty array.
        return [];
    }

    /**
     * Returns the parent of the specified child node, or null if the child node
     * is not found in this node or any of its children.
     *
     * @param childID - The ID of the child node to find the parent for.
     * @returns The parent node of the specified child node, or null if the
     * child node is not found.
     */
    parentOf(
        childID: string
    ): MenuItemNode | null {
        if (this.id === childID) {
            // If the current node is the child, return its parent.
            return this.parent;
        }
        for (const child of this.children) {
            if (child.id === childID) {
                // If we found the child, return the current node as its parent.
                return this;
            }
            else {
                // Recursively search for the child in the subtree.
                const parentNode = child.parentOf(childID);
                // If the child was found in the subtree, return the parent node.
                if (parentNode) {
                    return parentNode;
                }
            }
        }
        // If we reach this point, it means the child node was not found in
        // this node or any of its children, so we return null.
        return null;
    }

    /**
     * Returns the depth of the specified child node in the tree, or null if the
     * child node is not found. If the child node is the current node, the depth
     * is 0. If the child node is a direct child of the current node, the depth
     * is 1, and so on.
     *
     * @param childID - The ID of the child node to find the depth for.
     * @returns The depth of the specified child node in the tree, or null if
     * the child node is not found.
     */
    depthOfChild(
        childID: string
    ): number | null {
        if (this.id === childID) {
            // If the current node is the child, return 0 as its depth.
            return 0;
        }
        for (const child of this.children) {
            if (child.id === childID) {
                // If we found the child, return 1 as its depth.
                return 1;
            }
            else {
                // Recursively search for the child in the subtree and add 1
                // to the depth if the child is found.
                const depth = child.depthOfChild(childID);
                if (depth !== null) {
                    // If the child was found in the subtree, return the depth
                    // incremented by 1.
                    return depth + 1;
                }
            }
        }
        // If we reach this point, it means the child node was not found in
        // this node or any of its children, so we return -1 to indicate that
        // the child node does not exist in this tree.
        return null;
    }

    /**
     * Returns the root node of the tree.
     */
    getRootNode(): MenuItemNode {
        let currentNode: MenuItemNode | null = this;
        while (currentNode.parent) {
            currentNode = currentNode.parent;
        }
        return currentNode;
    }

    toPODObject(): MenuItemNodePOD {

        const pod: MenuItemNodePOD = {
            id: this.id
        };

        if (this.children.size > 0) {
            pod.children = [];
            for (const child of this.children) {
                pod.children.push(child.toPODObject());
            }
        }

        return pod;
    }

    toTreeString(): string {
        const lines: string[] = [];

        function buildLines(node: MenuItemNode, prefix: string): void {
            const childrenArray = Array.from(node.children);

            for (let i = 0; i < childrenArray.length; i++) {
                const child = childrenArray[i]!;
                const isLast = i === childrenArray.length - 1;
                const connector = isLast ? "└── " : "├── ";
                lines.push(`${prefix}${connector}${child.id}`);
                const nextPrefix = prefix + (isLast ? "    " : "│   ");

                // add blank line after child if it has children
                if (child.children.size > 0) {
                    lines.push(`${nextPrefix}│`);
                }

                buildLines(child, nextPrefix);

                // add connector line between siblings
                if (!isLast) {
                    lines.push(`${prefix}│`);
                }
            }
        }

        lines.push(this.id);
        if (this.children.size > 0) {
            lines.push("│");
        }
        buildLines(this, "");
        return lines.join("\n");
    }

    length(): number {
        let count = 1;
        for (const child of this.children) {
            count += child.length();
        }
        return count;
    }


    toString(): string {
        return JSON.stringify(this.toPODObject(), null, 4);
    }

}

// /* eslint-disable no-console */
// const tree = new MenuItemNode({
//     id: "root",
//     children: new Set([
//         new MenuItemNode({
//             id: "1 menu item",
//             children: new Set([
//                 new MenuItemNode({
//                     id: "1.1 menu item"
//                 }),
//                 new MenuItemNode({
//                     id: "1.2 menu item",
//                     children: new Set([
//                         new MenuItemNode({
//                             id: "1.2.1 menu item"
//                         }),
//                         new MenuItemNode({
//                             id: "1.2.2 menu item"
//                         })
//                     ])
//                 }),
//                 new MenuItemNode({
//                     id: "1.3 menu item",
//                     children: new Set([
//                         new MenuItemNode({
//                             id: "1.3.1 menu item",
//                             children: new Set([
//                                 new MenuItemNode({
//                                     id: "1.3.1.1 menu item"
//                                 }),
//                             ])
//                         }),
//                         new MenuItemNode({
//                             id: "1.3.2 menu item"
//                         })
//                     ])
//                 }),
//             ])
//         }),
//     ])
// });

// console.log(tree.toTreeString());

// console.log(`tree.toString(): ${tree.toString()}`) ;
// console.log("tree.toPODObject():", tree.toPODObject());

// console.log("path to 1.3.1:", tree.pathToChild("1.3.1"));
// console.log("path to root", tree.pathToChild("root"));
// console.log("path to non-existent child:", tree.pathToChild("non-existent"));
// console.log(`tree.buildTreeEndingAtChild("1.3.1"): ${tree.buildTreeEndingAtChild("1.3.1")}`);

// console.log(`tree.depthOfChild("root"): ${tree.depthOfChild("root")}`);
// console.log(`tree.depthOfChild("1"): ${tree.depthOfChild("1")}`);
// console.log(`tree.depthOfChild("1.1"): ${tree.depthOfChild("1.1")}`);
// console.log(`tree.depthOfChild("1.3.1"): ${tree.depthOfChild("1.3.1")}`);
// console.log(`tree.depthOfChild("non-existent"): ${tree.depthOfChild("non-existent")}`);
