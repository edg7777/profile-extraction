import { hasFormFields } from './detector';
import { fillPage } from './filler';
import { highlightField, clearHighlights } from './highlighter';
import type { Profile } from '@/types/profile';
import type { FillResult } from '@/types/form';

let floatingBar: HTMLElement | null = null;
let panelOpen = false;

function createFloatingBar(): void {
  if (floatingBar) return;

  floatingBar = document.createElement('div');
  floatingBar.id = 'autofill-resume-floating-bar';

  floatingBar.innerHTML = `
    <div class="ar-float-panel" id="ar-panel">
      <h3>AutoFill Resume</h3>
      <button class="ar-fill-btn" id="ar-fill-btn">一键填充</button>
      <div class="ar-status" id="ar-status"></div>
    </div>
    <button class="ar-float-btn" id="ar-toggle-btn" title="AutoFill Resume">AR</button>
  `;

  document.body.appendChild(floatingBar);

  const toggleBtn = document.getElementById('ar-toggle-btn');
  const panel = document.getElementById('ar-panel');
  const fillBtn = document.getElementById('ar-fill-btn');

  toggleBtn?.addEventListener('click', () => {
    panelOpen = !panelOpen;
    if (panel) {
      panel.classList.toggle('open', panelOpen);
    }
  });

  fillBtn?.addEventListener('click', async () => {
    const statusEl = document.getElementById('ar-status');
    if (fillBtn) (fillBtn as HTMLButtonElement).disabled = true;
    if (statusEl) {
      statusEl.textContent = '正在获取简历数据...';
      statusEl.className = 'ar-status';
    }

    try {
      const response = await chrome.runtime.sendMessage({ action: 'GET_ACTIVE_PROFILE' });
      if (!response?.success || !response.data) {
        if (statusEl) {
          statusEl.textContent = '请先在插件设置中填写简历数据';
          statusEl.className = 'ar-status error';
        }
        return;
      }

      const profile: Profile = response.data;
      if (statusEl) statusEl.textContent = '正在填充...';

      clearHighlights();
      const result: FillResult = await fillPage(profile);

      if (statusEl) {
        statusEl.textContent = `填充完成：${result.filled}/${result.total} 个字段`;
        statusEl.className = `ar-status ${result.filled > 0 ? 'success' : 'error'}`;
      }

      // Highlight filled fields
      result.details.forEach((d) => {
        if (d.status === 'filled' || d.status === 'needs_confirm' || d.status === 'failed') {
          // The element reference is in the mappings, not in details
          // We skip highlighting here for simplicity
        }
      });
    } catch (err) {
      if (statusEl) {
        statusEl.textContent = '填充失败：' + String(err);
        statusEl.className = 'ar-status error';
      }
    } finally {
      if (fillBtn) (fillBtn as HTMLButtonElement).disabled = false;
    }
  });
}

function removeFloatingBar(): void {
  if (floatingBar) {
    floatingBar.remove();
    floatingBar = null;
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'FILL_FORM') {
    const profile: Profile = message.data.profile;
    clearHighlights();
    fillPage(profile)
      .then((result) => {
        sendResponse({ success: true, data: result });
      })
      .catch((err) => {
        sendResponse({ success: false, error: String(err) });
      });
    return true; // async response
  }

  if (message.action === 'SCAN_FORM') {
    sendResponse({ success: true, data: { hasForm: hasFormFields() } });
    return;
  }
});

// Initialize
function init(): void {
  // Wait a bit for page to fully render
  setTimeout(() => {
    if (hasFormFields()) {
      createFloatingBar();
    }
  }, 1000);

  // Watch for dynamically added forms
  const observer = new MutationObserver(() => {
    if (hasFormFields() && !floatingBar) {
      createFloatingBar();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
