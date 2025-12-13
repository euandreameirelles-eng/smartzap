import Dagre from '@dagrejs/dagre'
import type { Node, Edge } from '@xyflow/react'

/**
 * Layout options for auto-arranging nodes
 */
export interface LayoutOptions {
    direction: 'TB' | 'LR' | 'BT' | 'RL' // Top-Bottom, Left-Right, etc.
    nodeWidth?: number
    nodeHeight?: number
    rankSep?: number // Separation between ranks (rows/columns)
    nodeSep?: number // Separation between nodes in same rank
}

const DEFAULT_OPTIONS: LayoutOptions = {
    direction: 'TB',
    nodeWidth: 280,
    nodeHeight: 100,
    rankSep: 80,
    nodeSep: 40,
}

/**
 * Apply Dagre auto-layout to nodes and edges
 * Returns new nodes with updated positions
 */
export function getLayoutedElements(
    nodes: Node[],
    edges: Edge[],
    options: Partial<LayoutOptions> = {}
): { nodes: Node[]; edges: Edge[] } {
    const opts = { ...DEFAULT_OPTIONS, ...options }

    const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}))

    g.setGraph({
        rankdir: opts.direction,
        ranksep: opts.rankSep,
        nodesep: opts.nodeSep,
    })

    // Add nodes to graph
    nodes.forEach((node) => {
        g.setNode(node.id, {
            width: opts.nodeWidth!,
            height: opts.nodeHeight!,
        })
    })

    // Add edges to graph
    edges.forEach((edge) => {
        g.setEdge(edge.source, edge.target)
    })

    // Run the layout algorithm
    Dagre.layout(g)

    // Update node positions
    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = g.node(node.id)
        return {
            ...node,
            position: {
                x: nodeWithPosition.x - opts.nodeWidth! / 2,
                y: nodeWithPosition.y - opts.nodeHeight! / 2,
            },
        }
    })

    return { nodes: layoutedNodes, edges }
}

/**
 * Quick helper for vertical (top-to-bottom) layout
 */
export function layoutVertical(nodes: Node[], edges: Edge[]) {
    return getLayoutedElements(nodes, edges, { direction: 'TB' })
}

/**
 * Quick helper for horizontal (left-to-right) layout
 */
export function layoutHorizontal(nodes: Node[], edges: Edge[]) {
    return getLayoutedElements(nodes, edges, { direction: 'LR' })
}
