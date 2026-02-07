import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  Alert,
  Platform,
  Pressable,
  Switch,
  ScrollView,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { BrandColors, Spacing, BorderRadius } from "@/constants/theme";

const NOTIFICATION_PREFS_KEY = "@notification_prefs";

interface NotificationPrefs {
  enabled: boolean;
  newShifts: boolean;
  shiftReminders: boolean;
  messages: boolean;
  updates: boolean;
}

const DEFAULT_PREFS: NotificationPrefs = {
  enabled: false,
  newShifts: true,
  shiftReminders: true,
  messages: true,
  updates: false,
};

try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch (e) {
  console.log("Notifications not supported in this environment");
}

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const savedPrefs = await AsyncStorage.getItem(NOTIFICATION_PREFS_KEY);
      if (savedPrefs) {
        setPrefs(JSON.parse(savedPrefs));
      }
    } catch (error) {
      console.error("Error loading notification preferences:", error);
    }
    setIsLoading(false);
  };

  const savePreferences = async (newPrefs: NotificationPrefs) => {
    try {
      await AsyncStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(newPrefs));
    } catch (error) {
      console.error("Error saving notification preferences:", error);
    }
  };

  const handleToggleNotifications = useCallback(async (value: boolean) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (value) {
      try {
        const { status: existingStatus } =
          await Notifications.getPermissionsAsync();

        if (existingStatus === "granted") {
          const newPrefs = { ...prefs, enabled: true };
          setPrefs(newPrefs);
          savePreferences(newPrefs);
          sendTestNotification();
          return;
        }

        const { status } = await Notifications.requestPermissionsAsync();

        if (status === "granted") {
          const newPrefs = { ...prefs, enabled: true };
          setPrefs(newPrefs);
          savePreferences(newPrefs);
          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          sendTestNotification();
        } else {
          Alert.alert(
            "Permission Required",
            "Please enable notifications in Settings to receive shift alerts.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Open Settings",
                onPress: () => {
                  if (Platform.OS !== "web") {
                    try {
                      Linking.openSettings();
                    } catch (error) {
                      // openSettings not supported
                    }
                  }
                },
              },
            ]
          );
        }
      } catch (e) {
        console.log("Notifications not supported in this environment");
        Alert.alert(
          "Not Available",
          "Push notifications are not available in Expo Go on Android. They will work in the production app."
        );
      }
    } else {
      const newPrefs = { ...prefs, enabled: false };
      setPrefs(newPrefs);
      savePreferences(newPrefs);
    }
  }, [prefs]);

  const handleTogglePref = useCallback(
    (key: keyof NotificationPrefs) => {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      const newPrefs = { ...prefs, [key]: !prefs[key] };
      setPrefs(newPrefs);
      savePreferences(newPrefs);
    },
    [prefs]
  );

  const sendTestNotification = async () => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Notifications Enabled",
          body: "You'll now receive alerts for new shifts and updates!",
          sound: true,
        },
        trigger: { seconds: 1, type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL },
      });
    } catch (e) {
      console.log("Local notifications not supported in this environment");
    }
  };

  const sendDemoNotification = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "New Shift Available",
          body: "RN - ICU position at Memorial Hospital. $45/hr. Tap to view details.",
          sound: true,
          data: { type: "new_shift", shiftId: "demo-123" },
        },
        trigger: { seconds: 2, type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL },
      });
    } catch (e) {
      console.log("Local notifications not supported in this environment");
    }

    Alert.alert(
      "Demo Notification Sent",
      "You'll receive a sample notification in 2 seconds."
    );
  };

  if (Platform.OS === "web") {
    return (
      <ThemedView style={styles.container}>
        <View
          style={[styles.content, { paddingTop: headerHeight + Spacing.xl }]}
        >
          <View style={[styles.iconCircle, { backgroundColor: "#FF3B3015" }]}>
            <Feather name="smartphone" size={48} color="#FF3B30" />
          </View>
          <ThemedText type="h3" style={styles.title}>
            Mobile Feature
          </ThemedText>
          <ThemedText
            type="body"
            style={[styles.subtitle, { color: theme.textSecondary }]}
          >
            Push notifications are available when using the app on your mobile
            device. Scan the QR code in Expo Go to access this feature.
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View
          style={[styles.content, { paddingTop: headerHeight + Spacing.xl }]}
        >
          <ThemedText>Loading...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.lg,
          paddingBottom: insets.bottom + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[styles.mainCard, { backgroundColor: theme.backgroundDefault }]}
        >
          <View style={styles.mainRow}>
            <View style={[styles.iconContainer, { backgroundColor: "#FF3B3015" }]}>
              <Feather name="bell" size={24} color="#FF3B30" />
            </View>
            <View style={styles.mainContent}>
              <ThemedText style={styles.mainTitle}>
                Push Notifications
              </ThemedText>
              <ThemedText
                type="small"
                style={{ color: theme.textSecondary }}
              >
                Get instant alerts on your device
              </ThemedText>
            </View>
            <Switch
              value={prefs.enabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: theme.border, true: BrandColors.primary }}
              thumbColor="#FFFFFF"
              testID="notifications-toggle"
            />
          </View>
        </View>

        {prefs.enabled ? (
          <>
            <ThemedText
              type="small"
              style={[styles.sectionTitle, { color: theme.textSecondary }]}
            >
              NOTIFICATION PREFERENCES
            </ThemedText>

            <View
              style={[
                styles.prefsCard,
                { backgroundColor: theme.backgroundDefault },
              ]}
            >
              <View style={styles.prefRow}>
                <View style={styles.prefContent}>
                  <ThemedText style={styles.prefTitle}>New Shifts</ThemedText>
                  <ThemedText
                    type="small"
                    style={{ color: theme.textSecondary }}
                  >
                    Alert when new shifts match your preferences
                  </ThemedText>
                </View>
                <Switch
                  value={prefs.newShifts}
                  onValueChange={() => handleTogglePref("newShifts")}
                  trackColor={{ false: theme.border, true: BrandColors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
              <View style={[styles.divider, { backgroundColor: theme.border }]} />

              <View style={styles.prefRow}>
                <View style={styles.prefContent}>
                  <ThemedText style={styles.prefTitle}>
                    Shift Reminders
                  </ThemedText>
                  <ThemedText
                    type="small"
                    style={{ color: theme.textSecondary }}
                  >
                    Remind me before scheduled shifts
                  </ThemedText>
                </View>
                <Switch
                  value={prefs.shiftReminders}
                  onValueChange={() => handleTogglePref("shiftReminders")}
                  trackColor={{ false: theme.border, true: BrandColors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
              <View style={[styles.divider, { backgroundColor: theme.border }]} />

              <View style={styles.prefRow}>
                <View style={styles.prefContent}>
                  <ThemedText style={styles.prefTitle}>Messages</ThemedText>
                  <ThemedText
                    type="small"
                    style={{ color: theme.textSecondary }}
                  >
                    Notify when you receive messages
                  </ThemedText>
                </View>
                <Switch
                  value={prefs.messages}
                  onValueChange={() => handleTogglePref("messages")}
                  trackColor={{ false: theme.border, true: BrandColors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
              <View style={[styles.divider, { backgroundColor: theme.border }]} />

              <View style={styles.prefRow}>
                <View style={styles.prefContent}>
                  <ThemedText style={styles.prefTitle}>App Updates</ThemedText>
                  <ThemedText
                    type="small"
                    style={{ color: theme.textSecondary }}
                  >
                    News and feature announcements
                  </ThemedText>
                </View>
                <Switch
                  value={prefs.updates}
                  onValueChange={() => handleTogglePref("updates")}
                  trackColor={{ false: theme.border, true: BrandColors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            <Pressable
              onPress={sendDemoNotification}
              style={[styles.demoButton, { backgroundColor: BrandColors.primary }]}
              testID="send-demo-notification-button"
            >
              <Feather name="send" size={18} color="#FFFFFF" />
              <ThemedText style={styles.demoButtonText}>
                Send Demo Notification
              </ThemedText>
            </Pressable>
          </>
        ) : (
          <View
            style={[
              styles.disabledCard,
              { backgroundColor: theme.backgroundDefault },
            ]}
          >
            <Feather name="bell-off" size={32} color={theme.textTertiary} />
            <ThemedText
              type="body"
              style={{ color: theme.textSecondary, textAlign: "center" }}
            >
              Enable notifications to receive instant alerts for new shifts,
              messages, and reminders.
            </ThemedText>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    alignItems: "center",
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: Spacing["2xl"],
  },
  mainCard: {
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
    overflow: "hidden",
  },
  mainRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  mainContent: {
    flex: 1,
  },
  mainTitle: {
    fontWeight: "600",
    marginBottom: 2,
  },
  sectionTitle: {
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  prefsCard: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  prefRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  prefContent: {
    flex: 1,
  },
  prefTitle: {
    fontWeight: "500",
    marginBottom: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: Spacing.lg,
  },
  demoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    marginTop: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  demoButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  disabledCard: {
    alignItems: "center",
    padding: Spacing["2xl"],
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
});
