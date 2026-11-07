export interface UEXMarketplaceListing {
  handle: string;
  itemUrl?: string;
  itemName?: string;
  price?: string;
  type?: 'WTS' | 'WTB';
}

export function extractHandleFromUrl(urlOrText: string): string | null {
  const match = urlOrText.match(/@([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

export function parseUEXAccountUser(html: string): string | null {
  const profileLinkMatch = html.match(/href=["'](?:https?:\/\/uexcorp\.space)?\/@([a-zA-Z0-9_-]+)["']/i);
  if (profileLinkMatch) {
    return profileLinkMatch[1];
  }

  const handleMatch = html.match(/(?:citizen|handle|username|profile)[\s\S]*?@([a-zA-Z0-9_-]+)/i);
  if (handleMatch) {
    return handleMatch[1];
  }

  return null;
}
