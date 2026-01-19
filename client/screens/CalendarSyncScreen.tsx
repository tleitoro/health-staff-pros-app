import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as Calendar from "expo-calendar";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { BrandColors, Spacing, BorderRadius } from "@/constants/theme";

interface ShiftExample {
  id: string;
  title: string;
  location: string;
  date: Date;
  startTime: string;
  endTime: string;
}

const SAMPLE_SHIFTS: ShiftExample[] = [
  {
    id: "1",
    title: "RN - Medical/Surgical",
    location: "Memorial Hospital",
    date: new Date(Date.now() + 86400000),
    startTime: "07:00",
    endTime: "19:00",
  },
  {
    id: "2",
    title: "CNA - Night Shift",
    location: "Sunrise Care Center",
    date: new Date(Date.now() + 172800000),
    startTime: "19:00",
    endTime: "07:00",
  },
];

export default function CalendarSyncScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  const [permission, setPermission] = useState<Calendar.PermissionResponse | null>(null);
  const [calendars, setCalendars] = useState<Calendar.Calendar[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    if (Platform.OS === "web") {
      setIsLoading(false);
      return;
    }

    const status = await Calendar.getCalendarPermissionsAsync();
    setPermission(status);

    if (status.granted) {
      loadCalendars();
    }
    setIsLoading(false);
  };

  const loadCalendars = async () => {
    try {
      const cals = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      setCalendars(cals.filter((c) => c.allowsModifications));
    } catch (error) {
      console.error("Error loading calendars:", error);
    }
  };

  const requestPermission = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const status = await Calendar.requestCalendarPermissionsAsync();
    setPermission(status);

    if (status.granted) {
      loadCalendars();
    } else if (!status.canAskAgain) {
      Alert.alert(
        "Permission Required",
        "Please enable calendar access in Settings to sync your shifts.",
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
  };

  const addShiftToCalendar = useCallback(
    async (shift: ShiftExample) => {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      if (calendars.length === 0) {
        Alert.alert("No Calendar", "No writable calendar found on device.");
        return;
      }

      try {
        const [startHour, startMin] = shift.startTime.split(":").map(Number);
        const [endHour, endMin] = shift.endTime.split(":").map(Number);

        const startDate = new Date(shift.date);
        startDate.setHours(startHour, startMin, 0, 0);

        const endDate = new Date(shift.date);
        endDate.setHours(endHour, endMin, 0, 0);
        if (endHour < startHour) {
          endDate.setDate(endDate.getDate() + 1);
        }

        const eventId = await Calendar.createEventAsync(calendars[0].id, {
          title: shift.title,
          location: shift.location,
          startDate,
          endDate,
          notes: "Added from Health Staff Pros app",
          alarms: [{ relativeOffset: -60 }],
        });

        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        Alert.alert(
          "Shift Added",
          `"${shift.title}" has been added to your calendar.`
        );
      } catch (error) {
        console.error("Error adding event:", error);
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        Alert.alert("Error", "Could not add shift to calendar. Please try again.");
      }
    },
    [calendars]
  );

  if (Platform.OS === "web") {
    return (
      <ThemedView style={styles.container}>
        <View
          style={[styles.content, { paddingTop: headerHeight + Spacing.xl }]}
        >
          <View style={[styles.iconCircle, { backgroundColor: "#34C75915" }]}>
            <Feather name="smartphone" size={48} color="#34C759" />
          </View>
          <ThemedText type="h3" style={styles.title}>
            Mobile Feature
          </ThemedText>
          <ThemedText
            type="body"
            style={[styles.subtitle, { color: theme.textSecondary }]}
          >
            Calendar sync is available when using the app on your mobile device.
            Scan the QR code in Expo Go to access this feature.
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

  if (!permission?.granted) {
    return (
      <ThemedView style={styles.container}>
        <View
          style={[styles.content, { paddingTop: headerHeight + Spacing.xl }]}
        >
          <View style={[styles.iconCircle, { backgroundColor: "#34C75915" }]}>
            <Feather name="calendar" size={48} color="#34C759" />
          </View>
          <ThemedText type="h3" style={styles.title}>
            Calendar Access
          </ThemedText>
          <ThemedText
            type="body"
            style={[styles.subtitle, { color: theme.textSecondary }]}
          >
            Allow access to your calendar to sync your shifts and never miss a
            scheduled assignment.
          </ThemedText>

          <Pressable
            onPress={requestPermission}
            style={[styles.button, { backgroundColor: BrandColors.primary }]}
            testID="enable-calendar-button"
          >
            <Feather name="calendar" size={20} color="#FFFFFF" />
            <ThemedText style={styles.buttonText}>Enable Calendar</ThemedText>
          </Pressable>
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
        <View style={styles.header}>
          <View style={[styles.iconCircleSmall, { backgroundColor: "#34C75915" }]}>
            <Feather name="check-circle" size={24} color="#34C759" />
          </View>
          <ThemedText type="body" style={{ color: theme.textSecondary }}>
            Calendar access enabled
          </ThemedText>
        </View>

        <ThemedText
          type="small"
          style={[styles.sectionTitle, { color: theme.textSecondary }]}
        >
          UPCOMING SHIFTS
        </ThemedText>
        <ThemedText
          type="small"
          style={[styles.sectionSubtitle, { color: theme.textTertiary }]}
        >
          Tap a shift to add it to your calendar
        </ThemedText>

        {SAMPLE_SHIFTS.map((shift) => (
          <Pressable
            key={shift.id}
            onPress={() => addShiftToCalendar(shift)}
            style={[styles.shiftCard, { backgroundColor: theme.backgroundDefault }]}
            testID={`shift-card-${shift.id}`}
          >
            <View style={styles.shiftInfo}>
              <ThemedText style={styles.shiftTitle}>{shift.title}</ThemedText>
              <View style={styles.shiftDetail}>
                <Feather name="map-pin" size={14} color={theme.textSecondary} />
                <ThemedText
                  type="small"
                  style={{ color: theme.textSecondary }}
                >
                  {shift.location}
                </ThemedText>
              </View>
              <View style={styles.shiftDetail}>
                <Feather name="clock" size={14} color={theme.textSecondary} />
                <ThemedText
                  type="small"
                  style={{ color: theme.textSecondary }}
                >
                  {shift.startTime} - {shift.endTime}
                </ThemedText>
              </View>
            </View>
            <View style={[styles.addButton, { backgroundColor: "#34C75915" }]}>
              <Feather name="plus" size={20} color="#34C759" />
            </View>
          </Pressable>
        ))}

        <View
          style={[styles.infoCard, { backgroundColor: theme.backgroundDefault }]}
        >
          <Feather name="info" size={20} color={theme.textSecondary} />
          <ThemedText
            type="small"
            style={[styles.infoText, { color: theme.textSecondary }]}
          >
            Your actual shifts will appear here once synced with your Health
            Staff Pros account.
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
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  iconCircleSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: Spacing["2xl"],
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing["2xl"],
    borderRadius: BorderRadius.md,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    marginBottom: Spacing.lg,
  },
  shiftCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  shiftInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  shiftTitle: {
    fontWeight: "600",
  },
  shiftDetail: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
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
