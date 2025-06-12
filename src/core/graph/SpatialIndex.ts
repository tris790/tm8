/**
 * Spatial indexing implementation using QuadTree for efficient O(log n) spatial queries
 * Handles viewport queries and nearest neighbor searches for large graphs
 */

import { Node, Position } from '../types/graph';
import { ViewportBounds } from './GraphStore';

interface QuadTreeNode<T> {
  bounds: ViewportBounds;
  items: Array<{ id: string; item: T; position: Position }>;
  children?: QuadTreeNode<T>[];
  maxItems: number;
  maxDepth: number;
  depth: number;
}

/**
 * QuadTree implementation for spatial partitioning
 */
class QuadTree<T> {
  private root: QuadTreeNode<T>;
  private readonly MAX_ITEMS = 10;
  private readonly MAX_DEPTH = 10;

  constructor(bounds: ViewportBounds) {
    this.root = {
      bounds,
      items: [],
      maxItems: this.MAX_ITEMS,
      maxDepth: this.MAX_DEPTH,
      depth: 0
    };
  }

  insert(id: string, item: T, position: Position): void {
    this.insertIntoNode(this.root, id, item, position);
  }

  remove(id: string): boolean {
    return this.removeFromNode(this.root, id);
  }

  query(bounds: ViewportBounds): Array<{ id: string; item: T; position: Position }> {
    const results: Array<{ id: string; item: T; position: Position }> = [];
    this.queryNode(this.root, bounds, results);
    return results;
  }

  nearest(point: Position, maxDistance: number): Array<{ id: string; item: T; position: Position; distance: number }> {
    const searchBounds: ViewportBounds = {
      x: point.x - maxDistance,
      y: point.y - maxDistance,
      width: maxDistance * 2,
      height: maxDistance * 2
    };

    const candidates = this.query(searchBounds);
    
    return candidates
      .map(candidate => ({
        ...candidate,
        distance: this.calculateDistance(point, candidate.position)
      }))
      .filter(candidate => candidate.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance);
  }

  private insertIntoNode(node: QuadTreeNode<T>, id: string, item: T, position: Position): void {
    if (!this.containsPoint(node.bounds, position)) {
      return;
    }

    if (node.items.length < node.maxItems || node.depth >= node.maxDepth) {
      node.items.push({ id, item, position });
      return;
    }

    if (!node.children) {
      this.subdivide(node);
    }

    for (const child of node.children!) {
      this.insertIntoNode(child, id, item, position);
    }
  }

  private removeFromNode(node: QuadTreeNode<T>, id: string): boolean {
    // Check items in current node
    const itemIndex = node.items.findIndex(item => item.id === id);
    if (itemIndex !== -1) {
      node.items.splice(itemIndex, 1);
      return true;
    }

    // Check children
    if (node.children) {
      for (const child of node.children) {
        if (this.removeFromNode(child, id)) {
          return true;
        }
      }
    }

    return false;
  }

  private queryNode(node: QuadTreeNode<T>, bounds: ViewportBounds, results: Array<{ id: string; item: T; position: Position }>): void {
    if (!this.intersects(node.bounds, bounds)) {
      return;
    }

    // Check items in current node
    for (const item of node.items) {
      if (this.containsPoint(bounds, item.position)) {
        results.push(item);
      }
    }

    // Check children
    if (node.children) {
      for (const child of node.children) {
        this.queryNode(child, bounds, results);
      }
    }
  }

  private subdivide(node: QuadTreeNode<T>): void {
    const x = node.bounds.x;
    const y = node.bounds.y;
    const halfWidth = node.bounds.width / 2;
    const halfHeight = node.bounds.height / 2;

    node.children = [
      // Top-left
      {
        bounds: { x, y, width: halfWidth, height: halfHeight },
        items: [],
        maxItems: node.maxItems,
        maxDepth: node.maxDepth,
        depth: node.depth + 1
      },
      // Top-right
      {
        bounds: { x: x + halfWidth, y, width: halfWidth, height: halfHeight },
        items: [],
        maxItems: node.maxItems,
        maxDepth: node.maxDepth,
        depth: node.depth + 1
      },
      // Bottom-left
      {
        bounds: { x, y: y + halfHeight, width: halfWidth, height: halfHeight },
        items: [],
        maxItems: node.maxItems,
        maxDepth: node.maxDepth,
        depth: node.depth + 1
      },
      // Bottom-right
      {
        bounds: { x: x + halfWidth, y: y + halfHeight, width: halfWidth, height: halfHeight },
        items: [],
        maxItems: node.maxItems,
        maxDepth: node.maxDepth,
        depth: node.depth + 1
      }
    ];

    // Redistribute existing items to children
    const itemsToRedistribute = [...node.items];
    node.items = [];

    for (const item of itemsToRedistribute) {
      for (const child of node.children) {
        this.insertIntoNode(child, item.id, item.item, item.position);
      }
    }
  }

  private containsPoint(bounds: ViewportBounds, point: Position): boolean {
    return point.x >= bounds.x && 
           point.x <= bounds.x + bounds.width &&
           point.y >= bounds.y && 
           point.y <= bounds.y + bounds.height;
  }

  private intersects(bounds1: ViewportBounds, bounds2: ViewportBounds): boolean {
    return !(bounds1.x > bounds2.x + bounds2.width ||
             bounds1.x + bounds1.width < bounds2.x ||
             bounds1.y > bounds2.y + bounds2.height ||
             bounds1.y + bounds1.height < bounds2.y);
  }

  private calculateDistance(p1: Position, p2: Position): number {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}

/**
 * High-performance spatial index for graph nodes using QuadTree
 */
export class SpatialIndex {
  private quadTree: QuadTree<Node>;
  private nodePositions = new Map<string, Position>();

  constructor(bounds: ViewportBounds = { x: -10000, y: -10000, width: 20000, height: 20000 }) {
    this.quadTree = new QuadTree<Node>(bounds);
  }

  /**
   * Insert a node into the spatial index
   */
  insert(node: Node): void {
    this.nodePositions.set(node.id, { ...node.position });
    this.quadTree.insert(node.id, node, node.position);
  }

  /**
   * Remove a node from the spatial index
   */
  remove(nodeId: string): void {
    this.nodePositions.delete(nodeId);
    this.quadTree.remove(nodeId);
  }

  /**
   * Update a node's position in the spatial index
   */
  update(node: Node): void {
    const oldPosition = this.nodePositions.get(node.id);
    if (oldPosition && (oldPosition.x !== node.position.x || oldPosition.y !== node.position.y)) {
      this.remove(node.id);
      this.insert(node);
    }
  }

  /**
   * Query nodes within viewport bounds - O(log n) performance
   */
  query(bounds: ViewportBounds): Node[] {
    const results = this.quadTree.query(bounds);
    return results.map(result => result.item);
  }

  /**
   * Find nearest nodes to a point within max distance
   */
  nearest(point: Position, maxDistance: number): Node[] {
    const results = this.quadTree.nearest(point, maxDistance);
    return results.map(result => result.item);
  }

  /**
   * Find the single nearest node to a point
   */
  findNearest(point: Position, maxDistance: number = Infinity): Node | null {
    const results = this.nearest(point, maxDistance);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Clear all nodes from the spatial index
   */
  clear(): void {
    this.nodePositions.clear();
    this.quadTree = new QuadTree<Node>({ x: -10000, y: -10000, width: 20000, height: 20000 });
  }

  /**
   * Get total number of indexed nodes
   */
  size(): number {
    return this.nodePositions.size;
  }

  /**
   * Check if a node is indexed
   */
  has(nodeId: string): boolean {
    return this.nodePositions.has(nodeId);
  }

  /**
   * Get statistics about the spatial index
   */
  getStats(): { totalNodes: number; treeDepth: number } {
    return {
      totalNodes: this.nodePositions.size,
      treeDepth: this.calculateTreeDepth()
    };
  }

  private calculateTreeDepth(): number {
    // This would require accessing the tree structure, simplified for now
    return Math.ceil(Math.log2(this.nodePositions.size)) || 0;
  }
}