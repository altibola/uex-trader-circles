function renderUser(user: any) {
  const userHandleEl = document.getElementById('user-handle');
  const syncStatusEl = document.getElementById('sync-status');
  const tagsEl = document.getElementById('circle-tags');
  const rsiInfoEl = document.getElementById('rsi-handle-info');

  if (!user || !user.uexHandle) {
    if (userHandleEl) userHandleEl.textContent = 'Not Connected';
    if (syncStatusEl) syncStatusEl.textContent = 'Open UEX Account';
    return;
  }

  if (userHandleEl) userHandleEl.textContent = `@${user.uexHandle}`;
  if (syncStatusEl) syncStatusEl.textContent = 'Synced';
  if (rsiInfoEl) {
    rsiInfoEl.textContent = `RSI Handle: ${user.rsiHandle || user.uexHandle}`;
  }

  if (tagsEl && user.circles) {
    tagsEl.innerHTML = user.circles
      .map(
        (c: any) => `
      <span class="circle-tag">
        ${c.type === 'rsi_org' ? '🚀 ' : '🪐 '}${c.name}
      </span>
    `
      )
      .join('');
  }
}

async function loadData() {
  chrome.runtime.sendMessage({ type: 'GET_CURRENT_USER' }, (res) => {
    if (res && res.success) {
      renderUser(res.data);
    }
  });

  chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (res) => {
    if (res && res.success) {
      const toggle = document.getElementById('toggle-optin') as HTMLInputElement;
      if (toggle) {
        toggle.checked = !!res.data.optInUexTraderCircles;
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadData();

  const toggle = document.getElementById('toggle-optin') as HTMLInputElement;
  if (toggle) {
    toggle.addEventListener('change', () => {
      chrome.runtime.sendMessage(
        {
          type: 'SAVE_SETTINGS',
          settings: { optInUexTraderCircles: toggle.checked }
        },
        () => {
          loadData();
        }
      );
    });
  }

  const clearBtn = document.getElementById('btn-clear-cache');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      clearBtn.textContent = 'Clearing...';
      chrome.runtime.sendMessage({ type: 'CLEAR_CACHE' }, () => {
        clearBtn.textContent = 'Cache Cleared!';
        setTimeout(() => {
          clearBtn.textContent = 'Clear 24h Cache';
        }, 1500);
      });
    });
  }
});
