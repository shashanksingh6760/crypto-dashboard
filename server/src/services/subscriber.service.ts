import { broadcastPriceUpdate, sendAlertNotification } from '../websocket';

/**
 * Replaces Redis pub/sub. Receives messages directly from the local in-memory worker.
 */
export function initializeSubscriber() {
  console.log('📡 Local pub/sub initialized');
}

export function handleLocalPubSub(channel: string, message: string) {
  try {
    const data = JSON.parse(message);

    if (channel === 'prices:update') {
      broadcastPriceUpdate(data);
    }

    if (channel === 'alert:triggered') {
      sendAlertNotification(data.userId, data.alert);
    }
  } catch (error) {
    console.error('Error processing pub/sub message:', error);
  }
}
