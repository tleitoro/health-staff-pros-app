import { Platform } from "react-native";
import Constants from "expo-constants";

let NotificationsModule: any = null;

try {
  NotificationsModule = require("expo-notifications");
} catch (e) {
  console.log("expo-notifications not available in this environment");
}

const isAvailable = NotificationsModule !== null;

export function setNotificationHandler(config: any) {
  if (!isAvailable) return;
  try {
    NotificationsModule.setNotificationHandler(config);
  } catch (e) {
    console.log("setNotificationHandler not supported");
  }
}

export function addNotificationReceivedListener(callback: (notification: any) => void) {
  if (!isAvailable) return { remove: () => {} };
  try {
    return NotificationsModule.addNotificationReceivedListener(callback);
  } catch (e) {
    return { remove: () => {} };
  }
}

export function addNotificationResponseReceivedListener(callback: (response: any) => void) {
  if (!isAvailable) return { remove: () => {} };
  try {
    return NotificationsModule.addNotificationResponseReceivedListener(callback);
  } catch (e) {
    return { remove: () => {} };
  }
}

export async function getPermissionsAsync() {
  if (!isAvailable) return { status: "undetermined" };
  try {
    return await NotificationsModule.getPermissionsAsync();
  } catch (e) {
    return { status: "undetermined" };
  }
}

export async function requestPermissionsAsync() {
  if (!isAvailable) return { status: "undetermined" };
  try {
    return await NotificationsModule.requestPermissionsAsync();
  } catch (e) {
    return { status: "undetermined" };
  }
}

export async function getExpoPushTokenAsync(options?: any) {
  if (!isAvailable) return { data: "" };
  try {
    return await NotificationsModule.getExpoPushTokenAsync(options);
  } catch (e) {
    return { data: "" };
  }
}

export async function scheduleNotificationAsync(config: any) {
  if (!isAvailable) {
    console.log("Notifications not available - skipping schedule");
    return;
  }
  try {
    return await NotificationsModule.scheduleNotificationAsync(config);
  } catch (e) {
    console.log("scheduleNotificationAsync failed:", e);
  }
}

export async function cancelAllScheduledNotificationsAsync() {
  if (!isAvailable) return;
  try {
    return await NotificationsModule.cancelAllScheduledNotificationsAsync();
  } catch (e) {
    console.log("cancelAllScheduledNotificationsAsync failed:", e);
  }
}

export async function getAllScheduledNotificationsAsync() {
  if (!isAvailable) return [];
  try {
    return await NotificationsModule.getAllScheduledNotificationsAsync();
  } catch (e) {
    return [];
  }
}

export async function setBadgeCountAsync(count: number) {
  if (!isAvailable) return;
  try {
    return await NotificationsModule.setBadgeCountAsync(count);
  } catch (e) {}
}

export async function getBadgeCountAsync() {
  if (!isAvailable) return 0;
  try {
    return await NotificationsModule.getBadgeCountAsync();
  } catch (e) {
    return 0;
  }
}

export { isAvailable as notificationsAvailable };
