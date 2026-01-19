import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { BrandColors, Spacing, BorderRadius } from "@/constants/theme";

const CACHED_SCHEDULE_KEY = "@cached_schedule";
const CACHE_TIMESTAMP_KEY = "@cache_timestamp";

interface CachedShift {
  id: string;
  title: string;
  location: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "confirmed" | "pending";
}

const DEMO_SCHEDULE: CachedShift[] = [
  {
    id: "1",
    title: "RN - ICU",
    location: "Memorial Hospital",
    date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    startTime: "07:00",
    endTime: "19:00",
    status: "confirmed",
  },
  {
    id: "2",
    title: "RN - Emergency",
    location: "City Medical Center",
    date: new Date(Date.now() + 172800000).toISOString().split("T")[0],
    startTime: "19:00",
    endTime: "07:00",
    status: "confirmed",
  },
  {
    id: "3",
    title: "CNA - Med/Surg",
    location: "Sunrise Care Center",
    date: new Date(Date.now() + 259200000).toISOString().split("T")[0],
    startTime: "07:00",
    endTime: "15:00",
    status: "pending",
  },
];

export default function OfflineScheduleScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  const [schedule, setSchedule] = useState<CachedShift[]>([]);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCachedSchedule();
  }, []);

  const loadCachedSchedule = async () => {
    try {
      const cachedData = await AsyncStorage.getItem(CACHED_SCHEDULE_KEY);
      const timestamp = await AsyncStorage.getItem(CACHE_TIMESTAMP_KEY);

      if (cachedData) {
        setSchedule(JSON.parse(cachedData));
      }
      if (timestamp) {
        setLastSync(new Date(timestamp));
      }
    } catch (error) {
      console.error("Error loading cached schedule:", error);
    }
    setIsLoading(false);
  };

  const syncSchedule = useCallback(async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setIsRefreshing(true);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    try {
      const now = new Date();
      await AsyncStorage.setItem(CACHED_SCHEDULE_KEY, JSON.stringify(DEMO_SCHEDULE));
      await AsyncStorage.setItem(CACHE_TIMESTAMP_KEY, now.toISOString());

      setSchedule(DEMO_SCHEDULE);
      setLastSync(now);

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert("Sync Complete", "Your schedule has been updated and saved for offline access.");
    } catch (error) {
      console.error("Error syncing schedule:", error);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      Alert.alert("Sync Failed", "Could not sync schedule. Please try again.");
    }

    setIsRefreshing(false);
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (dateStr === today.toISOString().split("T")[0]) {
      return "Today";
    } else if (dateStr === tomorrow.toISOString().split("T")[0]) {
      return "Tomorrow";
    }
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

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
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={syncSchedule}
            tintColor={BrandColors.primary}
          />
        }
      >
        <View
          style={[styles.syncCard, { backgroundColor: theme.backgroundDefault }]}
        >
          <View style={styles.syncInfo}>
            <View style={styles.syncStatus}>
              <Feather
                name={schedule.length > 0 ? "check-circle" : "alert-circle"}
                size={20}
                color={schedule.length > 0 ? BrandColors.success : "#FF9500"}
              />
              <ThemedText style={styles.syncStatusText}>
                {schedule.length > 0 ? "Schedule Cached" : "Not Synced"}
              </ThemedText>
            </View>
            {lastSync ? (
              <ThemedText
                type="small"
                style={{ color: theme.textSecondary }}
              >
                Last synced:{" "}
                {lastSync.toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </ThemedText>
            ) : (
              <ThemedText
                type="small"
                style={{ color: theme.textSecondary }}
              >
                Pull down or tap to sync
              </ThemedText>
            )}
          </View>
          <Pressable
            onPress={syncSchedule}
            style={[styles.syncButton, { backgroundColor: BrandColors.primary }]}
            testID="sync-schedule-button"
          >
            <Feather name="refresh-cw" size={18} color="#FFFFFF" />
          </Pressable>
        </View>

        <ThemedText
          type="small"
          style={[styles.sectionTitle, { color: theme.textSecondary }]}
        >
          {schedule.length > 0 ? "UPCOMING SHIFTS" : "NO CACHED SCHEDULE"}
        </ThemedText>

        {schedule.length === 0 ? (
          <View
            style={[
              styles.emptyState,
              { backgroundColor: theme.backgroundDefault },
            ]}
          >
            <View style={[styles.iconCircle, { backgroundColor: "#5856D615" }]}>
              <Feather name="download-cloud" size={32} color="#5856D6" />
            </View>
            <ThemedText
              type="body"
              style={[styles.emptyTitle, { color: theme.text }]}
            >
              Sync Your Schedule
            </ThemedText>
            <ThemedText
              type="small"
              style={{ color: theme.textSecondary, textAlign: "center" }}
            >
              Download your upcoming shifts to view them even without internet
              connection
            </ThemedText>
            <Pressable
              onPress={syncSchedule}
              style={[styles.button, { backgroundColor: BrandColors.primary }]}
            >
              <Feather name="download" size={20} color="#FFFFFF" />
              <ThemedText style={styles.buttonText}>Sync Now</ThemedText>
            </Pressable>
          </View>
        ) : (
          schedule.map((shift) => (
            <View
              key={shift.id}
              style={[
                styles.shiftCard,
                { backgroundColor: theme.backgroundDefault },
              ]}
            >
              <View style={styles.shiftHeader}>
                <View style={styles.dateContainer}>
                  <ThemedText style={styles.dateText}>
                    {formatDate(shift.date)}
                  </ThemedText>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        shift.status === "confirmed"
                          ? BrandColors.success + "15"
                          : "#FF950015",
                    },
                  ]}
                >
                  <ThemedText
                    type="small"
                    style={{
                      color:
                        shift.status === "confirmed"
                          ? BrandColors.success
                          : "#FF9500",
                      fontWeight: "600",
                    }}
                  >
                    {shift.status === "confirmed" ? "Confirmed" : "Pending"}
                  </ThemedText>
                </View>
              </View>
              <ThemedText style={styles.shiftTitle}>{shift.title}</ThemedText>
              <View style={styles.shiftDetails}>
                <View style={styles.detailRow}>
                  <Feather
                    name="map-pin"
                    size={14}
                    color={theme.textSecondary}
                  />
                  <ThemedText
                    type="small"
                    style={{ color: theme.textSecondary }}
                  >
                    {shift.location}
                  </ThemedText>
                </View>
                <View style={styles.detailRow}>
                  <Feather name="clock" size={14} color={theme.textSecondary} />
                  <ThemedText
                    type="small"
                    style={{ color: theme.textSecondary }}
                  >
                    {shift.startTime} - {shift.endTime}
                  </ThemedText>
                </View>
              </View>
            </View>
          ))
        )}

        <View
          style={[styles.infoCard, { backgroundColor: theme.backgroundDefault }]}
        >
          <Feather name="wifi-off" size={20} color={theme.textSecondary} />
          <ThemedText
            type="small"
            style={[styles.infoText, { color: theme.textSecondary }]}
          >
            Your cached schedule is available even when you're offline. Sync
            regularly to keep it up to date.
          </ThemedText>
        </View>
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
  syncCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
  },
  syncInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  syncStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  syncStatusText: {
    fontWeight: "600",
  },
  syncButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  emptyState: {
    alignItems: "center",
    padding: Spacing["2xl"],
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: {
    fontWeight: "600",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  shiftCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  shiftHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  dateContainer: {},
  dateText: {
    fontWeight: "600",
    color: BrandColors.primary,
  },
  statusBadge: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.xs,
  },
  shiftTitle: {
    fontWeight: "600",
    fontSize: 17,
    marginBottom: Spacing.sm,
  },
  shiftDetails: {
    gap: Spacing.xs,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
  },
  infoText: {
    flex: 1,
  },
});
