import { RSIOrganization } from '../types.js';

export function parseRSIOrganizationsHtml(html: string): RSIOrganization[] {
  const orgs: RSIOrganization[] = [];

  const blockRegex = /<div[^>]*class=["'][^"']*box-content\s+org\s+([^"']*)["'][^>]*>([\s\S]*?)(?=<div[^>]*class=["'][^"']*box-content\s+org|$)/gi;
  let match: RegExpExecArray | null;

  while ((match = blockRegex.exec(html)) !== null) {
    const classAttr = match[1] || '';
    const blockContent = match[2] || '';

    if (classAttr.includes('visibility-H') || blockContent.includes('Redacted')) {
      continue;
    }

    const isPrimary = classAttr.includes('main');

    const sidMatch =
      blockContent.match(/Spectrum Identification \(SID\)[\s\S]*?<strong[^>]*class=["']?[^"'>]*["']?>\s*([^<\s]+)\s*<\/strong>/i) ||
      blockContent.match(/href=["']\/orgs\/([^"'\s]+)["']/i);

    const sid = sidMatch ? sidMatch[1].trim() : '';

    if (!sid || sid.toLowerCase() === 'redacted') {
      continue;
    }

    const nameMatch =
      blockContent.match(new RegExp(`<a[^>]*href=["'](?:/en)?/orgs/${sid}["'][^>]*>\\s*([^<]+?)\\s*<\\/a>`, 'i')) ||
      blockContent.match(/<p[^>]*class=["']entry(?:\s+orgtitle)?["'][^>]*>[\s\S]*?<a[^>]*class=["']value[^"']*["'][^>]*>\s*([^<]+?)\s*<\/a>/i);

    const name = nameMatch ? nameMatch[1].trim() : sid;

    const logoMatch = blockContent.match(/<div class=["']thumb["']>[\s\S]*?<img[^>]*src=["']([^"']+)["']/i);
    const rawIconUrl = logoMatch ? logoMatch[1] : undefined;
    const iconUrl = rawIconUrl
      ? rawIconUrl.startsWith('http')
        ? rawIconUrl
        : `https://robertsspaceindustries.com${rawIconUrl}`
      : undefined;

    const membersMatch = blockContent.match(/(\d+)\s+members/i);
    const memberCount = membersMatch ? parseInt(membersMatch[1], 10) : undefined;

    const rankMatch = blockContent.match(/Organization rank[\s\S]*?<strong[^>]*class=["']?[^"'>]*["']?>\s*([^<\n\r]+?)\s*<\/strong>/i);
    const rank = rankMatch ? rankMatch[1].trim() : undefined;

    if (!orgs.some(o => o.sid.toUpperCase() === sid.toUpperCase())) {
      orgs.push({
        name,
        sid: sid.toUpperCase(),
        iconUrl,
        memberCount,
        isPrimary,
        rank
      });
    }
  }

  if (orgs.length === 0) {
    const fallbackLinkRegex = /href=["'](?:\/en)?\/orgs\/([A-Za-z0-9_-]+)["']/gi;
    let linkMatch: RegExpExecArray | null;
    while ((linkMatch = fallbackLinkRegex.exec(html)) !== null) {
      const sid = linkMatch[1].toUpperCase();
      if (sid !== 'REDACTED' && !orgs.some(o => o.sid === sid)) {
        orgs.push({
          name: sid,
          sid,
          isPrimary: orgs.length === 0
        });
      }
    }
  }

  return orgs;
}

export function parseRSIAccountOrganizationsHtml(html: string): RSIOrganization[] {
  return parseRSIOrganizationsHtml(html);
}
