/**
 * Demo graph data for testing the canvas integration
 */

import { Graph, Node, Edge, Boundary, NodeType, EdgeType, BoundaryType } from '@/core/types';

/**
 * Create a sample graph for demonstration purposes
 */
export const createDemoGraph = (): Graph => {
  const nodes: Node[] = [
    {
      id: 'web-server',
      type: NodeType.SERVICE,
      name: 'Web Server',
      position: { x: 100, y: 200 },
      properties: {
        team: 'Frontend Team',
        repo: 'web-app',
        scale: 1.0
      }
    },
    {
      id: 'api-gateway',
      type: NodeType.SERVICE,
      name: 'API Gateway',
      position: { x: 300, y: 200 },
      properties: {
        team: 'Platform Team',
        repo: 'api-gateway',
        scale: 1.0
      }
    },
    {
      id: 'user-service',
      type: NodeType.PROCESS,
      name: 'User Service',
      position: { x: 500, y: 100 },
      properties: {
        team: 'Backend Team',
        repo: 'user-service',
        scale: 1.0
      }
    },
    {
      id: 'order-service',
      type: NodeType.PROCESS,
      name: 'Order Service',
      position: { x: 500, y: 300 },
      properties: {
        team: 'Backend Team',
        repo: 'order-service',
        scale: 1.0
      }
    },
    {
      id: 'user-db',
      type: NodeType.DATASTORE,
      name: 'User Database',
      position: { x: 700, y: 100 },
      properties: {
        team: 'Data Team',
        dbType: 'PostgreSQL',
        scale: 1.0
      }
    },
    {
      id: 'order-db',
      type: NodeType.DATASTORE,
      name: 'Order Database',
      position: { x: 700, y: 300 },
      properties: {
        team: 'Data Team',
        dbType: 'PostgreSQL',
        scale: 1.0
      }
    },
    {
      id: 'external-payment',
      type: NodeType.EXTERNAL_ENTITY,
      name: 'Payment Provider',
      position: { x: 300, y: 400 },
      properties: {
        vendor: 'Stripe',
        scale: 1.0
      }
    },
    {
      id: 'mobile-app',
      type: NodeType.EXTERNAL_ENTITY,
      name: 'Mobile App',
      position: { x: 100, y: 50 },
      properties: {
        platform: 'iOS/Android',
        scale: 1.0
      }
    }
  ];

  const edges: Edge[] = [
    {
      id: 'mobile-to-gateway',
      type: EdgeType.HTTPS,
      source: 'mobile-app',
      targets: ['api-gateway'],
      properties: {
        encrypted: true,
        routes: ['/api/v1/*'],
        thickness: 2.0
      }
    },
    {
      id: 'web-to-gateway',
      type: EdgeType.HTTPS,
      source: 'web-server',
      targets: ['api-gateway'],
      properties: {
        encrypted: true,
        routes: ['/api/v1/*'],
        thickness: 2.0
      }
    },
    {
      id: 'gateway-to-user',
      type: EdgeType.GRPC,
      source: 'api-gateway',
      targets: ['user-service'],
      properties: {
        encrypted: true,
        routes: ['/users/*'],
        thickness: 2.0
      }
    },
    {
      id: 'gateway-to-order',
      type: EdgeType.GRPC,
      source: 'api-gateway',
      targets: ['order-service'],
      properties: {
        encrypted: true,
        routes: ['/orders/*'],
        thickness: 2.0
      }
    },
    {
      id: 'user-to-db',
      type: EdgeType.GRPC,
      source: 'user-service',
      targets: ['user-db'],
      properties: {
        encrypted: true,
        connection: 'pool',
        thickness: 2.0
      }
    },
    {
      id: 'order-to-db',
      type: EdgeType.GRPC,
      source: 'order-service',
      targets: ['order-db'],
      properties: {
        encrypted: true,
        connection: 'pool',
        thickness: 2.0
      }
    },
    {
      id: 'order-to-payment',
      type: EdgeType.HTTPS,
      source: 'order-service',
      targets: ['external-payment'],
      properties: {
        encrypted: true,
        webhook: true,
        thickness: 2.0
      }
    },
    {
      id: 'order-to-user',
      type: EdgeType.GRPC,
      source: 'order-service',
      targets: ['user-service'],
      properties: {
        encrypted: true,
        purpose: 'user lookup',
        thickness: 1.5
      }
    }
  ];

  const boundaries: Boundary[] = [
    {
      id: 'dmz-boundary',
      type: BoundaryType.TRUST_BOUNDARY,
      name: 'DMZ Boundary',
      position: { x: 80, y: 150 },
      bounds: { width: 240, height: 120 },
      properties: {
        security_level: 'public',
        firewall: true
      }
    },
    {
      id: 'internal-services',
      type: BoundaryType.NETWORK_ZONE,
      name: 'Internal Services',
      position: { x: 480, y: 80 },
      bounds: { width: 240, height: 240 },
      properties: {
        security_level: 'internal',
        vpc: 'main-vpc'
      }
    },
    {
      id: 'data-layer',
      type: BoundaryType.TRUST_BOUNDARY,
      name: 'Data Layer',
      position: { x: 680, y: 80 },
      bounds: { width: 120, height: 240 },
      properties: {
        security_level: 'restricted',
        encryption: 'at-rest'
      }
    }
  ];

  return {
    nodes,
    edges,
    boundaries,
    metadata: {
      name: 'E-commerce Threat Model Demo',
      version: '1.0.0',
      created: new Date('2024-01-01'),
      modified: new Date()
    }
  };
};