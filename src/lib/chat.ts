export type ChatNode = {
	id: string;
	role: 'user' | 'assistant';
	content: string;
	children: ChatNode[];
	activeChildIndex: number;
};

export function createRootNode(): ChatNode {
	return {
		id: 'root',
		role: 'assistant',
		content: '',
		children: [],
		activeChildIndex: 0
	};
}

export function createNode(role: 'user' | 'assistant', content: string): ChatNode {
	return {
		id: crypto.randomUUID(),
		role,
		content,
		children: [],
		activeChildIndex: 0
	};
}

export type DisplayEntry = {
	node: ChatNode;
	siblingCount: number;
	siblingIndex: number;
};

/** Walk the active branch of the tree and return a flat display path */
export function getDisplayPath(root: ChatNode): DisplayEntry[] {
	const result: DisplayEntry[] = [];
	let current = root;
	while (current.children.length > 0) {
		const idx = clampIndex(current.activeChildIndex, current.children.length);
		const child = current.children[idx];
		result.push({
			node: child,
			siblingCount: current.children.length,
			siblingIndex: idx
		});
		current = child;
	}
	return result;
}

/** Get the active path as an array of nodes (no sibling metadata) */
export function getActivePath(root: ChatNode): ChatNode[] {
	const path: ChatNode[] = [];
	let current = root;
	while (current.children.length > 0) {
		const idx = clampIndex(current.activeChildIndex, current.children.length);
		current = current.children[idx];
		path.push(current);
	}
	return path;
}

/** Get the leaf node of the active path */
export function getActiveLeaf(root: ChatNode): ChatNode {
	let current = root;
	while (current.children.length > 0) {
		const idx = clampIndex(current.activeChildIndex, current.children.length);
		current = current.children[idx];
	}
	return current;
}

/** Find a node by ID in the tree */
export function findNode(nodeId: string, current: ChatNode): ChatNode | null {
	if (current.id === nodeId) return current;
	for (const child of current.children) {
		const found = findNode(nodeId, child);
		if (found) return found;
	}
	return null;
}

/** Find the parent of a node by ID */
export function findParent(nodeId: string, current: ChatNode): ChatNode | null {
	for (const child of current.children) {
		if (child.id === nodeId) return current;
		const found = findParent(nodeId, child);
		if (found) return found;
	}
	return null;
}

/** Navigate to a sibling branch. Returns true if navigation occurred. */
export function navigateSibling(
	root: ChatNode,
	nodeId: string,
	direction: 'prev' | 'next'
): boolean {
	const parent = findParent(nodeId, root);
	if (!parent) return false;
	const delta = direction === 'prev' ? -1 : 1;
	const newIndex = parent.activeChildIndex + delta;
	if (newIndex >= 0 && newIndex < parent.children.length) {
		parent.activeChildIndex = newIndex;
		return true;
	}
	return false;
}

/** Attach a new child node to a parent and set it as active. Returns the proxied child. */
export function attachChild(parent: ChatNode, child: ChatNode): ChatNode {
	parent.children.push(child);
	parent.activeChildIndex = parent.children.length - 1;
	return parent.children[parent.activeChildIndex];
}

function clampIndex(index: number, length: number): number {
	return Math.min(Math.max(0, index), length - 1);
}
