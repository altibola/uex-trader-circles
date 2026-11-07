import {
  Circle,
  CurrentUserSession,
  ExtensionSettings,
  RSIOrganization,
  TraderProfile
} from './types.js';
import { CacheManager, DEFAULT_TTL_MS } from './cache.js';
import { parseRSIOrganizationsHtml } from './scrapers/rsi.js';
import { createRSIOrgCircle, DEFAULT_UEX_CIRCLE, findSharedCircles } from './circles.js';

export interface CirclesServiceOptions {
  fetchHtml?: (url: string) => Promise<string>;
}

export class CirclesService {
  private fetchHtml: (url: string) => Promise<string>;

  constructor(
    private cache: CacheManager,
    options?: CirclesServiceOptions
  ) {
    this.fetchHtml = options?.fetchHtml || (async (url: string) => {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to fetch ${url}: ${res.statusText}`);
      }
      return res.text();
    });
  }

  async getSettings(): Promise<ExtensionSettings> {
    const settings = await this.cache.get<ExtensionSettings>('settings');
    if (!settings) {
      const defaultSettings: ExtensionSettings = {
        optInUexTraderCircles: true,
        cacheTtlHours: 24,
        syncIntervalHours: 24
      };
      await this.cache.set('settings', defaultSettings, Infinity);
      return defaultSettings;
    }
    return settings;
  }

  async saveSettings(settings: Partial<ExtensionSettings>): Promise<ExtensionSettings> {
    const current = await this.getSettings();
    const updated = { ...current, ...settings };
    await this.cache.set('settings', updated, Infinity);
    return updated;
  }

  async getCurrentUser(): Promise<CurrentUserSession> {
    const session = await this.cache.get<CurrentUserSession>('current_user_session');
    const settings = await this.getSettings();

    const circles: Circle[] = [];
    if (settings.optInUexTraderCircles) {
      circles.push(DEFAULT_UEX_CIRCLE);
    }

    if (session && session.circles) {
      for (const c of session.circles) {
        if (!circles.some(existing => existing.id === c.id)) {
          circles.push(c);
        }
      }
    }

    return {
      uexHandle: session?.uexHandle,
      rsiHandle: session?.rsiHandle || session?.uexHandle,
      circles,
      lastChecked: session?.lastChecked || 0
    };
  }

  async setCurrentUser(uexHandle: string, rsiHandle?: string): Promise<CurrentUserSession> {
    const effectiveRsiHandle = rsiHandle || uexHandle;
    const orgs = await this.fetchCitizenOrganizations(effectiveRsiHandle);
    const orgCircles = orgs.map(createRSIOrgCircle);

    const session: CurrentUserSession = {
      uexHandle,
      rsiHandle: effectiveRsiHandle,
      circles: orgCircles,
      lastChecked: Date.now()
    };

    await this.cache.set('current_user_session', session, Infinity);
    return this.getCurrentUser();
  }

  async fetchCitizenOrganizations(handle: string): Promise<RSIOrganization[]> {
    const cacheKey = `rsi:orgs:${handle.toLowerCase()}`;
    const cached = await this.cache.get<RSIOrganization[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const url = `https://robertsspaceindustries.com/en/citizens/${encodeURIComponent(handle)}/organizations`;
      const html = await this.fetchHtml(url);
      const orgs = parseRSIOrganizationsHtml(html);
      await this.cache.set(cacheKey, orgs, DEFAULT_TTL_MS);
      return orgs;
    } catch (err) {
      console.error(`Error fetching organizations for ${handle}:`, err);
      await this.cache.set(cacheKey, [], 15 * 60 * 1000);
      return [];
    }
  }

  async getTraderProfile(handle: string): Promise<TraderProfile> {
    const cacheKey = `trader:profile:${handle.toLowerCase()}`;
    const cached = await this.cache.get<TraderProfile>(cacheKey);
    if (cached) {
      return cached;
    }

    const orgs = await this.fetchCitizenOrganizations(handle);
    const circles: Circle[] = orgs.map(createRSIOrgCircle);

    const profile: TraderProfile = {
      handle,
      circles,
      lastUpdated: Date.now()
    };

    await this.cache.set(cacheKey, profile, DEFAULT_TTL_MS);
    return profile;
  }

  async getSharedCirclesWith(targetHandle: string): Promise<{
    targetHandle: string;
    sharedCircles: Circle[];
    allTargetCircles: Circle[];
  }> {
    const currentUser = await this.getCurrentUser();
    const traderProfile = await this.getTraderProfile(targetHandle);

    const sharedCircles = findSharedCircles(currentUser.circles, traderProfile.circles);

    return {
      targetHandle,
      sharedCircles,
      allTargetCircles: traderProfile.circles
    };
  }
}
