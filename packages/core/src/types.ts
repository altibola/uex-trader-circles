export type CircleType = 'optin' | 'rsi_org';

export interface Circle {
  id: string; // e.g., 'uex-trader-circles' or 'rsi-org:D0T'
  type: CircleType;
  name: string;
  sid?: string; // Spectrum Identification for RSI orgs
  iconUrl?: string;
  isPrimary?: boolean;
}

export interface RSIOrganization {
  name: string;
  sid: string;
  iconUrl?: string;
  memberCount?: number;
  isPrimary: boolean;
  rank?: string;
}

export interface TraderProfile {
  handle: string;
  circles: Circle[];
  lastUpdated: number;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // TTL in milliseconds
}

export interface ExtensionSettings {
  optInUexTraderCircles: boolean;
  cacheTtlHours: number;
  syncIntervalHours: number;
}

export interface CurrentUserSession {
  uexHandle?: string;
  rsiHandle?: string;
  circles: Circle[];
  lastChecked: number;
}
