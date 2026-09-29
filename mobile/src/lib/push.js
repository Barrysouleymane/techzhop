import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { supabase } from "./supabase";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Asks permission and saves this phone's push token for the user.
 * Silently does nothing on simulators or when the Expo project isn't
 * linked yet (run `npx eas-cli init` once to link it).
 */
export async function registerForPush(userId, language) {
  try {
    if (!userId || !Device.isDevice) return null;

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) return null;

    let { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      ({ status } = await Notifications.requestPermissionsAsync());
    }
    if (status !== "granted") return "denied";

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });

    await supabase.from("push_tokens").upsert({
      token,
      user_id: userId,
      platform: Platform.OS,
      language,
      updated_at: new Date().toISOString(),
    });

    return token;
  } catch (err) {
    console.log("Push registration skipped:", err?.message);
    return null;
  }
}
