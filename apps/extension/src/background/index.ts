import { CacheManager, CirclesService } from '@uex-circles/core';
import { ChromeStorageAdapter } from './storageAdapter.js';

const storage = new ChromeStorageAdapter();
const cache = new CacheManager(storage);
const service = new CirclesService(cache);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.type) return false;

  (async () => {
    try {
      switch (message.type) {
        case 'GET_CURRENT_USER': {
          const user = await service.getCurrentUser();
          sendResponse({ success: true, data: user });
          break;
        }

        case 'SET_CURRENT_USER': {
          const { uexHandle, rsiHandle } = message;
          const user = await service.setCurrentUser(uexHandle, rsiHandle);
          sendResponse({ success: true, data: user });
          break;
        }

        case 'GET_SHARED_CIRCLES': {
          const { targetHandle } = message;
          const res = await service.getSharedCirclesWith(targetHandle);
          sendResponse(res);
          break;
        }

        case 'GET_SETTINGS': {
          const settings = await service.getSettings();
          sendResponse({ success: true, data: settings });
          break;
        }

        case 'SAVE_SETTINGS': {
          const { settings } = message;
          const updated = await service.saveSettings(settings);
          sendResponse({ success: true, data: updated });
          break;
        }

        case 'CLEAR_CACHE': {
          await cache.clear();
          sendResponse({ success: true });
          break;
        }

        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (err: any) {
      console.error('Background worker error:', err);
      sendResponse({ success: false, error: err?.message || String(err) });
    }
  })();

  return true;
});
