/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BlogPost {
  id: string;
  title: string;
  summary: string;
  content: string; // Markdown content
  author: string;
  createdAt: string;
  tags: string[];
  widgetType: 'none' | 'subnet' | 'bgp-sim' | 'config-translator';
}

export type NetworkWidgetType = BlogPost['widgetType'];

export interface CIDRResult {
  network: string;
  netmask: string;
  wildcard: string;
  broadcast: string;
  firstUsable: string;
  lastUsable: string;
  totalHosts: number;
  binaryMask: string;
  ipClass: string;
}

export interface RouterNode {
  id: string;
  name: string;
  asn: number;
  bgpPeers: string[]; // ids of connected nodes
  latency: number; // simulated latency
  isActive: boolean;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  device: string;
  level: 'INFO' | 'WARNING' | 'CRITICAL' | 'DEBUG';
  message: string;
}
