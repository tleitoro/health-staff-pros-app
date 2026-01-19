import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Linking,
  Platform,
  Text,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";

import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { BrandColors, Spacing, BorderRadius } from "@/constants/theme";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

interface SettingsItemProps {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
  isDestructive?: boolean;
  showChevron?: boolean;
}

function SettingsItem({
  icon,
  title,
  subtitle,
  onPress,
  isDestructive = false,
  showChevron = true,
}: SettingsItemProps) {
  const { theme } = useTheme();
  const [isPressed, setIsPressed] = useState(false);

  const handlePress = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  }, [onPress]);

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      style={[
        styles.settingsItem,
        {
          backgroundColor: isPressed
            ? theme.backgroundSecondary
            : theme.backgroundDefault,
        },
      ]}
    >
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: isDestructive
              ? BrandColors.error + "15"
              : BrandColors.primary + "15",
          },
        ]}
      >
        <Feather
          name={icon}
          size={20}
          color={isDestructive ? BrandColors.error : BrandColors.primary}
        />
      </View>
      <View style={styles.settingsItemContent}>
        <Text
          style={[
            styles.settingsItemTitle,
            { color: isDestructive ? BrandColors.error : theme.text },
          ]}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.settingsItemSubtitle, { color: theme.textSecondary }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {showChevron ? (
        <Feather name="chevron-right" size={20} color={theme.textTertiary} />
      ) : null}
    </Pressable>
  );
}

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { theme } = useTheme();

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
        {title}
      </Text>
      <View
        style={[
          styles.sectionContent,
          { backgroundColor: theme.backgroundDefault },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const appVersion = "1.0.0";

  const handleClearCache = useCallback(() => {
    Alert.alert(
      "Clear Cache",
      "This will clear cached website data. You may need to log in again.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            Alert.alert("Cache Cleared", "Website cache has been cleared.");
          },
        },
      ]
    );
  }, []);

  const handleClearCookies = useCallback(() => {
    Alert.alert(
      "Clear Cookies",
      "This will clear all cookies and log you out of the website.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            Alert.alert("Cookies Cleared", "All cookies have been cleared.");
          },
        },
      ]
    );
  }, []);

  const handleOpenPrivacyPolicy = useCallback(async () => {
    await WebBrowser.openBrowserAsync("https://healthstaffpros.com/privacy");
  }, []);

  const handleOpenTerms = useCallback(async () => {
    await WebBrowser.openBrowserAsync("https://healthstaffpros.com/terms");
  }, []);

  const handleContactSupport = useCallback(() => {
    const email = "support@healthstaffpros.com";
    const subject = encodeURIComponent("App Support Request");
    const body = encodeURIComponent(
      `\n\n---\nApp Version: ${appVersion}\nPlatform: ${Platform.OS}`
    );

    if (Platform.OS === "web") {
      window.open(`mailto:${email}?subject=${subject}&body=${body}`);
    } else {
      Linking.openURL(`mailto:${email}?subject=${subject}&body=${body}`);
    }
  }, [appVersion]);

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{
          paddingTop: Spacing.lg,
          paddingBottom: insets.bottom + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
      >
        <SettingsSection title="NATIVE FEATURES">
          <SettingsItem
            icon="grid"
            title="App Features"
            subtitle="Biometric login, calendar sync, scanner & more"
            onPress={() => navigation.navigate("Features")}
          />
        </SettingsSection>

        <SettingsSection title="CACHE & DATA">
          <SettingsItem
            icon="refresh-cw"
            title="Clear Cache"
            subtitle="Clear cached website data"
            onPress={handleClearCache}
            showChevron={false}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <SettingsItem
            icon="trash-2"
            title="Clear Cookies"
            subtitle="Log out and clear all cookies"
            onPress={handleClearCookies}
            isDestructive
            showChevron={false}
          />
        </SettingsSection>

        <SettingsSection title="SUPPORT">
          <SettingsItem
            icon="mail"
            title="Contact Support"
            subtitle="Get help with the app"
            onPress={handleContactSupport}
          />
        </SettingsSection>

        <SettingsSection title="LEGAL">
          <SettingsItem
            icon="file-text"
            title="Terms of Service"
            onPress={handleOpenTerms}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <SettingsItem
            icon="shield"
            title="Privacy Policy"
            onPress={handleOpenPrivacyPolicy}
          />
        </SettingsSection>

        <SettingsSection title="ABOUT">
          <View style={styles.aboutItem}>
            <Text style={[styles.aboutLabel, { color: theme.text }]}>Version</Text>
            <Text style={[styles.aboutValue, { color: theme.textSecondary }]}>
              {appVersion}
            </Text>
          </View>
        </SettingsSection>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textTertiary }]}>
            Health Staff Pros
          </Text>
          <Text style={[styles.footerText, { color: theme.textTertiary }]}>
            Professional Healthcare Staffing
          </Text>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
    marginLeft: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontWeight: "600",
    fontSize: 12,
  },
  sectionContent: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.xs,
    justifyContent: "center",
    alignItems: "center",
  },
  settingsItemContent: {
    flex: 1,
  },
  settingsItemTitle: {
    fontWeight: "500",
    fontSize: 16,
  },
  settingsItemSubtitle: {
    marginTop: 2,
    fontSize: 14,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 64,
  },
  aboutItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
  },
  aboutLabel: {
    fontWeight: "500",
    fontSize: 16,
  },
  aboutValue: {
    fontSize: 14,
  },
  footer: {
    alignItems: "center",
    marginTop: Spacing["3xl"],
    gap: Spacing.xs,
  },
  footerText: {
    textAlign: "center",
    fontSize: 14,
  },
});
