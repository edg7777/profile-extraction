import type { Message, MessageResponse } from '@/types/message';

export function sendMessage(message: Message): Promise<MessageResponse> {
  return chrome.runtime.sendMessage(message);
}

export function sendTabMessage(tabId: number, message: Message): Promise<MessageResponse> {
  return chrome.tabs.sendMessage(tabId, message);
}

export function onMessage(
  handler: (
    message: Message,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: MessageResponse) => void
  ) => boolean | void
): void {
  chrome.runtime.onMessage.addListener(handler);
}
