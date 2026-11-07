import { Circle, RSIOrganization } from './types.js';

export const UEX_TRADER_CIRCLES_ID = 'uex-trader-circles';

export const DEFAULT_UEX_CIRCLE: Circle = {
  id: UEX_TRADER_CIRCLES_ID,
  type: 'optin',
  name: 'UEX Trader Circles',
  iconUrl: ''
};

export function createRSIOrgCircle(org: RSIOrganization): Circle {
  return {
    id: `rsi-org:${org.sid.toUpperCase()}`,
    type: 'rsi_org',
    name: org.name,
    sid: org.sid.toUpperCase(),
    iconUrl: org.iconUrl,
    isPrimary: org.isPrimary
  };
}

export function findSharedCircles(currentUserCircles: Circle[], targetTraderCircles: Circle[]): Circle[] {
  const currentMap = new Map<string, Circle>();
  for (const c of currentUserCircles) {
    currentMap.set(c.id.toLowerCase(), c);
  }

  const shared: Circle[] = [];
  for (const target of targetTraderCircles) {
    if (currentMap.has(target.id.toLowerCase())) {
      shared.push(target);
    }
  }

  return shared;
}
