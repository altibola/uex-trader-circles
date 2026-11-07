import { describe, it, expect, beforeEach } from 'vitest';
import {
  parseRSIOrganizationsHtml,
  parseRSIAccountOrganizationsHtml
} from '../src/scrapers/rsi.js';
import { extractHandleFromUrl, parseUEXAccountUser } from '../src/scrapers/uex.js';
import { MemoryStorageAdapter, CacheManager } from '../src/cache.js';
import { CirclesService } from '../src/service.js';
import {
  findSharedCircles,
  DEFAULT_UEX_CIRCLE,
  createRSIOrgCircle,
  UEX_TRADER_CIRCLES_ID
} from '../src/circles.js';
import { Circle, RSIOrganization } from '../src/types.js';

describe('RSI Scraper', () => {
  const sampleRSIHtml = `
    <div class="box-content org main visibility-V">
      <div class="inner-bg clearfix">
        <div class="title">Main organization </div>
        <div class="left-col">
          <div class="inner clearfix">
            <div class="thumb">
              <a href="/orgs/D0T"><img src="https://theverse.robertsspaceindustries.com/logo.png" /></a>
              <span class="members">51 members</span>
            </div>
            <div class="info">
              <p class="entry">
                <a href="/orgs/D0T" class="value">Den Of Thieves</a>
              </p>
              <p class="entry">
                <span class="label">Spectrum Identification (SID)</span>
                <strong class="value">D0T</strong>
              </p>
              <p class="entry">
                <span class="label">Organization rank</span>
                <strong class="value">VE - Commander</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="box-content org affiliation visibility-V">
      <div class="inner-bg clearfix">
        <div class="title">Affiliation </div>
        <div class="left-col">
          <div class="inner clearfix">
            <div class="thumb">
              <a href="/orgs/LDYNASTY"><img src="https://cdn.robertsspaceindustries.com/dynasty.jpg" /></a>
              <span class="members">4 members</span>
            </div>
            <div class="info">
              <p class="entry orgtitle">
                <a href="/orgs/LDYNASTY" class="value data3">The Ling Dynasty</a>
              </p>
              <p class="entry">
                <span class="label data6">Spectrum Identification (SID)</span>
                <strong class="value data7">LDYNASTY</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="box-content org affiliation visibility-H">
      <div class="title">Redacted organization</div>
      <p>Redacted</p>
    </div>
  `;

  it('correctly parses main and affiliation organizations while ignoring Redacted/hidden entries', () => {
    const orgs = parseRSIOrganizationsHtml(sampleRSIHtml);
    expect(orgs).toHaveLength(2);

    expect(orgs[0]).toEqual({
      name: 'Den Of Thieves',
      sid: 'D0T',
      iconUrl: 'https://theverse.robertsspaceindustries.com/logo.png',
      memberCount: 51,
      isPrimary: true,
      rank: 'VE - Commander'
    });

    expect(orgs[1]).toEqual({
      name: 'The Ling Dynasty',
      sid: 'LDYNASTY',
      iconUrl: 'https://cdn.robertsspaceindustries.com/dynasty.jpg',
      memberCount: 4,
      isPrimary: false,
      rank: undefined
    });
  });

  it('parses account organization page identically via parseRSIAccountOrganizationsHtml', () => {
    const orgs = parseRSIAccountOrganizationsHtml(sampleRSIHtml);
    expect(orgs).toHaveLength(2);
    expect(orgs[0].sid).toBe('D0T');
  });

  it('uses fallback link extraction when org markup differs slightly', () => {
    const fallbackHtml = `
      <div class="container">
        <p>Member of <a href="/en/orgs/CORP1">Corporation 1</a> and <a href="/orgs/CORP2">Corporation 2</a></p>
        <a href="/orgs/REDACTED">Hidden</a>
      </div>
    `;
    const orgs = parseRSIOrganizationsHtml(fallbackHtml);
    expect(orgs).toHaveLength(2);
    expect(orgs.map(o => o.sid)).toEqual(['CORP1', 'CORP2']);
    expect(orgs[0].isPrimary).toBe(true);
    expect(orgs[1].isPrimary).toBe(false);
  });

  it('returns empty array when HTML contains only redacted or invalid orgs', () => {
    const emptyHtml = `<div class="box-content org visibility-H">Redacted</div>`;
    expect(parseRSIOrganizationsHtml(emptyHtml)).toEqual([]);
  });
});

describe('UEX Scraper', () => {
  it('extracts username handle from various url formats and strings', () => {
    expect(extractHandleFromUrl('https://uexcorp.space/@RS_Snake')).toBe('RS_Snake');
    expect(extractHandleFromUrl('/@1juzik')).toBe('1juzik');
    expect(extractHandleFromUrl('some text with @Trader_01')).toBe('Trader_01');
    expect(extractHandleFromUrl('plain text without handle')).toBe(null);
    expect(extractHandleFromUrl('https://uexcorp.space/marketplace/')).toBe(null);
  });

  it('extracts user from account page html with profile link', () => {
    const html = `<div>Welcome <a href="https://uexcorp.space/@TestPilot" class="user-link">TestPilot</a></div>`;
    expect(parseUEXAccountUser(html)).toBe('TestPilot');
  });

  it('extracts user from account page with handle label fallback', () => {
    const html = `<div>Citizen Profile: @StarTrader99</div>`;
    expect(parseUEXAccountUser(html)).toBe('StarTrader99');
  });

  it('returns null if account html does not have user identifier', () => {
    expect(parseUEXAccountUser('<div>Log in to view account</div>')).toBe(null);
  });
});

describe('CacheManager and StorageAdapter', () => {
  it('handles set, get, remove, clear, and TTL expiration', async () => {
    const storage = new MemoryStorageAdapter();
    const cache = new CacheManager(storage, 100); // 100ms default TTL

    // set and get
    await cache.set('item1', { name: 'Alpha' });
    expect(await cache.get('item1')).toEqual({ name: 'Alpha' });

    // remove
    await cache.remove('item1');
    expect(await cache.get('item1')).toBe(null);

    // clear
    await cache.set('item2', { name: 'Beta' });
    await cache.set('item3', { name: 'Gamma' });
    await cache.clear();
    expect(await cache.get('item2')).toBe(null);
    expect(await cache.get('item3')).toBe(null);

    // TTL expiration
    await cache.set('temp', { active: true }, 50);
    expect(await cache.get('temp')).toEqual({ active: true });
    await new Promise(r => setTimeout(r, 70));
    expect(await cache.get('temp')).toBe(null);
  });
});

describe('Circles Logic', () => {
  const org1: RSIOrganization = {
    name: 'Den Of Thieves',
    sid: 'D0T',
    isPrimary: true,
    iconUrl: 'https://example.com/d0t.png'
  };

  it('createRSIOrgCircle maps RSIOrganization to Circle', () => {
    const circle = createRSIOrgCircle(org1);
    expect(circle).toEqual({
      id: 'rsi-org:D0T',
      type: 'rsi_org',
      name: 'Den Of Thieves',
      sid: 'D0T',
      iconUrl: 'https://example.com/d0t.png',
      isPrimary: true
    });
  });

  it('findSharedCircles matches circles case-insensitively', () => {
    const currentCircles: Circle[] = [
      DEFAULT_UEX_CIRCLE,
      { id: 'rsi-org:D0T', type: 'rsi_org', name: 'Den Of Thieves' }
    ];

    const targetCircles: Circle[] = [
      { id: 'RSI-ORG:d0t', type: 'rsi_org', name: 'Den Of Thieves' },
      { id: 'rsi-org:OTHER', type: 'rsi_org', name: 'Other Org' }
    ];

    const shared = findSharedCircles(currentCircles, targetCircles);
    expect(shared).toHaveLength(1);
    expect(shared[0].id).toBe('RSI-ORG:d0t');
  });

  it('findSharedCircles returns empty array if no shared circles', () => {
    const c1: Circle[] = [{ id: 'c1', type: 'optin', name: 'Circle 1' }];
    const c2: Circle[] = [{ id: 'c2', type: 'optin', name: 'Circle 2' }];
    expect(findSharedCircles(c1, c2)).toEqual([]);
  });
});

describe('CirclesService & Settings', () => {
  let service: CirclesService;
  let cache: CacheManager;
  let mockHtmlResponses: Record<string, string>;

  beforeEach(() => {
    mockHtmlResponses = {
      'https://robertsspaceindustries.com/en/citizens/RS_Snake/organizations': `
        <div class="box-content org main visibility-V">
          <div class="inner clearfix">
            <a href="/orgs/D0T" class="value">Den Of Thieves</a>
            <span class="label">Spectrum Identification (SID)</span>
            <strong class="value">D0T</strong>
          </div>
        </div>
      `,
      'https://robertsspaceindustries.com/en/citizens/1juzik/organizations': `
        <div class="box-content org main visibility-V">
          <div class="inner clearfix">
            <a href="/orgs/D0T" class="value">Den Of Thieves</a>
            <span class="label">Spectrum Identification (SID)</span>
            <strong class="value">D0T</strong>
          </div>
        </div>
        <div class="box-content org affiliation visibility-V">
          <div class="inner clearfix">
            <a href="/orgs/TEST_ORG" class="value">Test Org</a>
            <span class="label">Spectrum Identification (SID)</span>
            <strong class="value">TEST_ORG</strong>
          </div>
        </div>
      `,
      'https://robertsspaceindustries.com/en/citizens/OtherCitizen/organizations': `
        <div class="box-content org main visibility-V">
          <div class="inner clearfix">
            <a href="/orgs/SOLO" class="value">Solo Trader</a>
            <span class="label">Spectrum Identification (SID)</span>
            <strong class="value">SOLO</strong>
          </div>
        </div>
      `
    };

    const storage = new MemoryStorageAdapter();
    cache = new CacheManager(storage, 24 * 60 * 60 * 1000);
    service = new CirclesService(cache, {
      fetchHtml: async (url: string) => {
        if (mockHtmlResponses[url]) return mockHtmlResponses[url];
        throw new Error('Not Found');
      }
    });
  });

  it('reads default settings and allows updates', async () => {
    const defaults = await service.getSettings();
    expect(defaults.optInUexTraderCircles).toBe(true);

    const updated = await service.saveSettings({ optInUexTraderCircles: false });
    expect(updated.optInUexTraderCircles).toBe(false);

    const reloaded = await service.getSettings();
    expect(reloaded.optInUexTraderCircles).toBe(false);
  });

  it('matches shared organizations between current user and target trader', async () => {
    await service.setCurrentUser('RS_Snake');

    const result = await service.getSharedCirclesWith('1juzik');
    expect(result.sharedCircles.map(c => c.sid)).toContain('D0T');
    expect(result.sharedCircles.length).toBe(1);

    const soloResult = await service.getSharedCirclesWith('OtherCitizen');
    expect(soloResult.sharedCircles.length).toBe(0);
  });

  it('handles fetch errors gracefully without throwing', async () => {
    const orgs = await service.fetchCitizenOrganizations('NonExistentTrader999');
    expect(orgs).toEqual([]);
  });

  it('respects opt-in toggle for UEX Trader Circles', async () => {
    await service.saveSettings({ optInUexTraderCircles: false });
    const userWithoutOptin = await service.getCurrentUser();
    expect(userWithoutOptin.circles.some(c => c.id === UEX_TRADER_CIRCLES_ID)).toBe(false);

    await service.saveSettings({ optInUexTraderCircles: true });
    const userWithOptin = await service.getCurrentUser();
    expect(userWithOptin.circles.some(c => c.id === UEX_TRADER_CIRCLES_ID)).toBe(true);
  });
});
