import { extractHandleFromUrl, parseUEXAccountUser } from '@uex-circles/core';
import { GALAXY_ICON_SVG, scheduleHide, showPopover } from './popover.js';

const profileCache = new Map<string, any>();

async function getTraderCircles(handle: string) {
  if (profileCache.has(handle)) {
    return profileCache.get(handle);
  }

  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { type: 'GET_SHARED_CIRCLES', targetHandle: handle },
      (response) => {
        if (chrome.runtime.lastError || !response) {
          console.warn('Error fetching circles for', handle, chrome.runtime.lastError);
          resolve(null);
          return;
        }
        profileCache.set(handle, response);
        resolve(response);
      }
    );
  });
}

function processPage() {
  const currentUrl = window.location.href;

  if (currentUrl.includes('/account')) {
    const handle = parseUEXAccountUser(document.body.innerHTML);
    if (handle) {
      chrome.runtime.sendMessage({ type: 'SET_CURRENT_USER', uexHandle: handle });
    }
  }

  const links = document.querySelectorAll<HTMLAnchorElement>('a[href*="/@"]');
  links.forEach((link) => {
    if (link.dataset.uexCirclesTagged) return;
    link.dataset.uexCirclesTagged = 'true';

    const handle = extractHandleFromUrl(link.href) || extractHandleFromUrl(link.textContent || '');
    if (!handle) return;

    link.classList.add('uex-circles-trader-nick');

    const badge = document.createElement('span');
    badge.className = 'uex-circles-badge';
    badge.title = `Circles: ${handle}`;
    badge.innerHTML = GALAXY_ICON_SVG;

    const onMouseEnter = async () => {
      const data = await getTraderCircles(handle);
      if (data) {
        showPopover(badge, handle, data.sharedCircles || [], data.allTargetCircles || []);
      }
    };

    const onMouseLeave = () => {
      scheduleHide();
    };

    badge.addEventListener('mouseenter', onMouseEnter);
    badge.addEventListener('mouseleave', onMouseLeave);
    link.addEventListener('mouseenter', onMouseEnter);
    link.addEventListener('mouseleave', onMouseLeave);

    if (link.nextSibling) {
      link.parentNode?.insertBefore(badge, link.nextSibling);
    } else {
      link.parentNode?.appendChild(badge);
    }
  });

  if (window.location.pathname.startsWith('/@')) {
    const handle = window.location.pathname.replace('/@', '').split('/')[0];
    if (handle) {
      const pageHeader = document.querySelector('h1, h2, .profile-name, .user-name');
      if (pageHeader && !pageHeader.getAttribute('data-uex-circles-tagged')) {
        pageHeader.setAttribute('data-uex-circles-tagged', 'true');
        pageHeader.classList.add('uex-circles-trader-nick');

        const badge = document.createElement('span');
        badge.className = 'uex-circles-badge';
        badge.innerHTML = GALAXY_ICON_SVG;

        badge.addEventListener('mouseenter', async () => {
          const data = await getTraderCircles(handle);
          if (data) {
            showPopover(badge, handle, data.sharedCircles || [], data.allTargetCircles || []);
          }
        });
        badge.addEventListener('mouseleave', scheduleHide);

        pageHeader.appendChild(badge);
      }
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', processPage);
} else {
  processPage();
}

const observer = new MutationObserver(() => {
  processPage();
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
