import { Circle } from '@uex-circles/core';

let popoverEl: HTMLElement | null = null;
let currentTargetEl: HTMLElement | null = null;
let hideTimer: any = null;

export const GALAXY_ICON_SVG = `
<svg viewBox="0 0 128 128" width="16" height="16" fill="none" class="uex-circles-icon" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="cg" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95" />
      <stop offset="35%" stop-color="#80d0ff" stop-opacity="0.8" />
      <stop offset="100%" stop-color="#7928ca" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="ag1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00f2fe" />
      <stop offset="100%" stop-color="#7928ca" />
    </linearGradient>
    <linearGradient id="ag2" x1="100%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#ff007a" />
      <stop offset="100%" stop-color="#00f2fe" />
    </linearGradient>
  </defs>
  <circle cx="64" cy="64" r="30" fill="url(#cg)" />
  <path d="M 64 64 C 64 54, 75 48, 86 52 C 98 56, 106 69, 102 84 C 98 98, 82 110, 64 110 C 42 110, 22 92, 22 66 C 22 36, 48 16, 78 18" stroke="url(#ag1)" stroke-width="6" stroke-linecap="round"/>
  <path d="M 64 64 C 64 74, 53 80, 42 76 C 30 72, 22 59, 26 44 C 30 30, 46 18, 64 18 C 86 18, 106 36, 106 62 C 106 92, 80 112, 50 110" stroke="url(#ag2)" stroke-width="6" stroke-linecap="round"/>
  <circle cx="64" cy="64" r="5" fill="#ffffff" />
</svg>
`;

function getOrCreatePopover(): HTMLElement {
  if (!popoverEl) {
    popoverEl = document.createElement('div');
    popoverEl.className = 'uex-circles-popover';
    popoverEl.addEventListener('mouseenter', () => {
      if (hideTimer) clearTimeout(hideTimer);
    });
    popoverEl.addEventListener('mouseleave', () => {
      scheduleHide();
    });
    document.body.appendChild(popoverEl);
  }
  return popoverEl;
}

export function showPopover(anchorEl: HTMLElement, handle: string, sharedCircles: Circle[], allCircles: Circle[]) {
  if (hideTimer) clearTimeout(hideTimer);
  currentTargetEl = anchorEl;
  const popover = getOrCreatePopover();

  const sharedCount = sharedCircles.length;
  const titleText = sharedCount > 0 ? `${sharedCount} Shared Circle${sharedCount > 1 ? 's' : ''}!` : `Circles Profile`;

  let itemsHtml = '';
  if (sharedCircles.length > 0) {
    itemsHtml = sharedCircles
      .map(
        c => `
      <li class="uex-circles-item shared">
        <div class="uex-circles-item-icon">
          ${c.iconUrl ? `<img src="${c.iconUrl}" width="18" height="18" style="border-radius:4px" />` : '🪐'}
        </div>
        <span class="uex-circles-item-name">${escapeHtml(c.name)}</span>
        <span class="uex-circles-item-badge">In Common</span>
      </li>
    `
      )
      .join('');
  } else if (allCircles.length > 0) {
    itemsHtml = allCircles
      .map(
        c => `
      <li class="uex-circles-item">
        <div class="uex-circles-item-icon">
          ${c.iconUrl ? `<img src="${c.iconUrl}" width="18" height="18" style="border-radius:4px" />` : '🪐'}
        </div>
        <span class="uex-circles-item-name">${escapeHtml(c.name)}</span>
      </li>
    `
      )
      .join('');
  } else {
    itemsHtml = `<div class="uex-circles-empty">No public organizations or circles found.</div>`;
  }

  popover.innerHTML = `
    <div class="uex-circles-popover-header">
      <div style="flex-shrink:0;">${GALAXY_ICON_SVG}</div>
      <div>
        <div class="uex-circles-popover-title">${escapeHtml(handle)}</div>
        <div class="uex-circles-popover-subtitle">${titleText}</div>
      </div>
    </div>
    <ul class="uex-circles-list">
      ${itemsHtml}
    </ul>
  `;

  const rect = anchorEl.getBoundingClientRect();
  const top = rect.bottom + window.scrollY + 6;
  const left = Math.max(10, Math.min(window.innerWidth - 300, rect.left + window.scrollX - 40));

  popover.style.top = `${top}px`;
  popover.style.left = `${left}px`;
  popover.classList.add('visible');
}

export function scheduleHide() {
  if (hideTimer) clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    if (popoverEl) {
      popoverEl.classList.remove('visible');
    }
    currentTargetEl = null;
  }, 250);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
