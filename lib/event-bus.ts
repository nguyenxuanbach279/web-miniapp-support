import { EventEmitter } from 'events';

const globalForEvents = global as unknown as { notificationEmitter: EventEmitter };

export const notificationEmitter =
  globalForEvents.notificationEmitter || new EventEmitter();

if (process.env.NODE_ENV !== 'production') {
  globalForEvents.notificationEmitter = notificationEmitter;
}
