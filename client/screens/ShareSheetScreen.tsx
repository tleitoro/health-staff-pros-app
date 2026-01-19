import React, { useCallback } from "react";
import {
  View,
  StyleSheet,
  Platform,
  Pressable,
  ScrollView,
  Share,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { BrandColors, Spacing, BorderRadius } from "@/constants/theme";

interface ShareOption {
  id: string;
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
  color: string;
  message: string;
  url?: string;
}

const SHARE_OPTIONS: ShareOption[] = [
  {
    id: "job",
    icon: "briefcase",
    title: "Share a Job Opening",
    description: "Let others know about available positions",
    color: "#007AFF",
    message: "Check out this healthcare job opportunity at Health Staff Pros!",
    url: "https://healthstaffpros.com/jobs",
  },
  {
    id: "app",
    icon: "download",
    title: "Share the App",
    description: "Invite someone to download the app",
    color: "#34C759",
    message: "I've been using the Health Staff Pros app for healthcare staffing. Download it here:",
    url: "https://healthstaffpros.com/app",
  },
  {
    id: "referral",
    icon: "gift",
    title: "Share Referral Link",
    description: "Earn rewards for successful referrals",
    color: "#AF52DE",
    message: "Join Health Staff Pros using my referral link and we both earn rewards!",
    url: "https://healthstaffpros.com/referral?code=USER123",
  },
  {
    id: "profile",
    icon: "user",
    title: "Share Your Profile",
    description: "Share your professional profile with facilities",
    color: "#FF9500",
    message: "View my healthcare professional profile on Health Staff Pros:",
    url: "https://healthstaffpros.com/profile/demo",
  },
];

export default function ShareSheetScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  const handleShare = useCallback(async (option: ShareOption) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      const result = await Share.share({
        message: option.url 
          ? `${option.message}\n\n${option.url}`
          : option.message,
        title: option.title,
        url: Platform.OS === "ios" ? option.url : undefined,
      });

      if (result.action === Share.sharedAction) {
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  }, []);

  const handleQuickShare = useCallback(async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      await Share.share({
        message: "I'm using Health Staff Pros for healthcare staffing. Check it out at healthstaffpros.com",
        title: "Health Staff Pros",
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  }, []);

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
          <View style={[styles.iconCircle, { backgroundColor: "#00C7BE15" }]}>
            <Feather name="share-2" size={32} color="#00C7BE" />
          </View>
          <ThemedText type="h3" style={styles.headerTitle}>
            Share
          </ThemedText>
          <ThemedText
            type="body"
            style={[styles.headerSubtitle, { color: theme.textSecondary }]}
          >
            Share Health Staff Pros with your network
          </ThemedText>
        </View>

        <Pressable
          onPress={handleQuickShare}
          style={[styles.quickShareButton, { backgroundColor: BrandColors.primary }]}
          testID="quick-share-button"
        >
          <Feather name="share" size={20} color="#FFFFFF" />
          <ThemedText style={styles.quickShareText}>Quick Share</ThemedText>
        </Pressable>

        <ThemedText
          type="small"
          style={[styles.sectionTitle, { color: theme.textSecondary }]}
        >
          SHARE OPTIONS
        </ThemedText>

        {SHARE_OPTIONS.map((option) => (
          <Pressable
            key={option.id}
            onPress={() => handleShare(option)}
            style={[
              styles.optionCard,
              { backgroundColor: theme.backgroundDefault },
            ]}
            testID={`share-option-${option.id}`}
          >
            <View
              style={[
                styles.optionIcon,
                { backgroundColor: option.color + "15" },
              ]}
            >
              <Feather name={option.icon} size={24} color={option.color} />
            </View>
            <View style={styles.optionContent}>
              <ThemedText style={styles.optionTitle}>{option.title}</ThemedText>
              <ThemedText
                type="small"
                style={{ color: theme.textSecondary }}
              >
                {option.description}
              </ThemedText>
            </View>
            <Feather name="share" size={18} color={theme.textTertiary} />
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
            Sharing uses your device's native share menu. Choose from messaging
            apps, email, social media, and more.
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
  header: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    textAlign: "center",
  },
  quickShareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
  },
  quickShareText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  sectionTitle: {
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontWeight: "600",
    marginBottom: 2,
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
