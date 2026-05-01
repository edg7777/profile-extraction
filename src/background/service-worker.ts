import { getActiveProfile, getAllProfiles, saveProfile, deleteProfile, setActiveProfileId, getActiveProfileId } from '@/utils/storage';
import type { Message, MessageResponse } from '@/types/message';

chrome.runtime.onMessage.addListener(
  (message: Message, _sender, sendResponse: (response: MessageResponse) => void) => {
    handleMessage(message).then(sendResponse).catch((err) => {
      sendResponse({ success: false, error: String(err) });
    });
    return true; // async response
  }
);

async function handleMessage(message: Message): Promise<MessageResponse> {
  switch (message.action) {
    case 'GET_ACTIVE_PROFILE': {
      const profile = await getActiveProfile();
      return { success: true, data: profile };
    }

    case 'GET_ALL_PROFILES': {
      const profiles = await getAllProfiles();
      return { success: true, data: profiles };
    }

    case 'GET_PROFILE': {
      const id = await getActiveProfileId();
      return { success: true, data: id };
    }

    case 'SAVE_PROFILE': {
      await saveProfile(message.data);
      return { success: true };
    }

    case 'DELETE_PROFILE': {
      await deleteProfile(message.data.id);
      return { success: true };
    }

    case 'SET_ACTIVE_PROFILE': {
      await setActiveProfileId(message.data.id);
      return { success: true };
    }

    default:
      return { success: false, error: `Unknown action: ${message.action}` };
  }
}

// Open options page on install
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.runtime.openOptionsPage();
  }
});
