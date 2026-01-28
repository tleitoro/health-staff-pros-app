import React, { useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { BrandColors, Spacing, BorderRadius } from "@/constants/theme";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

interface FeatureCardProps {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
  onPress: () => void;
  color?: string;
}

function FeatureCard({
  icon,
  title,
  description,
  onPress,
  color = BrandColors.primary,
}: FeatureCardProps) {
  const { theme } = useTheme();
  const [isPressed, setIsPressed] = React.useState(false);

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
        styles.featureCard,
        {
          backgroundColor: isPressed
            ? theme.backgroundSecondary
            : theme.backgroundDefault,
        },
      ]}
      testID={`feature-${title.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + "15" }]}>
        <Feather name={icon} size={24} color={color} />
      </View>
      <View style={styles.featureContent}>
        <ThemedText style={styles.featureTitle}>{title}</ThemedText>
        <ThemedText
          type="small"
          style={[styles.featureDescription, { color: theme.textSecondary }]}
        >
          {description}
        </ThemedText>
      </View>
      <Feather name="chevron-right" size={20} color={theme.textTertiary} />
    </Pressable>
  );
}

export default function FeaturesScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleNavigate = useCallback(
    (screen: keyof RootStackParamList) => {
      navigation.navigate(screen as any);
    },
    [navigation]
  );

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
        <View style={styles.header}>
          <ThemedText type="h3" style={styles.headerTitle}>
            Native Features
          </ThemedText>
          <ThemedText
            type="small"
            style={[styles.headerSubtitle, { color: theme.textSecondary }]}
          >
            Access exclusive app features not available on the web
          </ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText
            type="small"
            style={[styles.sectionTitle, { color: theme.textSecondary }]}
          >
            SECURITY
          </ThemedText>
          <View
            style={[
              styles.sectionContent,
              { backgroundColor: theme.backgroundDefault },
            ]}
          >
            <FeatureCard
              icon="unlock"
              title="Biometric Login"
              description="Sign in securely with Face ID or Touch ID"
              onPress={() => handleNavigate("BiometricAuth")}
              color="#007AFF"
            />
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText
            type="small"
            style={[styles.sectionTitle, { color: theme.textSecondary }]}
          >
            PRODUCTIVITY
          </ThemedText>
          <View
            style={[
              styles.sectionContent,
              { backgroundColor: theme.backgroundDefault },
            ]}
          >
            <FeatureCard
              icon="calendar"
              title="Calendar Sync"
              description="Add shifts directly to your device calendar"
              onPress={() => handleNavigate("CalendarSync")}
              color="#34C759"
            />
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <FeatureCard
              icon="download"
              title="Offline Schedule"
              description="View your schedule without internet"
              onPress={() => handleNavigate("OfflineSchedule")}
              color="#5856D6"
            />
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText
            type="small"
            style={[styles.sectionTitle, { color: theme.textSecondary }]}
          >
            DOCUMENTS
          </ThemedText>
          <View
            style={[
              styles.sectionContent,
              { backgroundColor: theme.backgroundDefault },
            ]}
          >
            <FeatureCard
              icon="camera"
              title="Document Scanner"
              description="Scan licenses and certifications"
              onPress={() => handleNavigate("DocumentScanner")}
              color="#FF9500"
            />
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText
            type="small"
            style={[styles.sectionTitle, { color: theme.textSecondary }]}
          >
            COMMUNICATION
          </ThemedText>
          <View
            style={[
              styles.sectionContent,
              { backgroundColor: theme.backgroundDefault },
            ]}
          >
            <FeatureCard
              icon="bell"
              title="Push Notifications"
              description="Get instant alerts for new shifts"
              onPress={() => handleNavigate("Notifications")}
              color="#FF3B30"
            />
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <FeatureCard
              icon="users"
              title="Refer a Friend"
              description="Invite contacts to join Health Staff Pros"
              onPress={() => handleNavigate("ContactPicker")}
              color="#AF52DE"
            />
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <FeatureCard
              icon="share"
              title="Share"
              description="Share job opportunities with others"
              onPress={() => handleNavigate("ShareSheet")}
              color="#00C7BE"
            />
          </View>
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
  header: {
    marginBottom: Spacing.xl,
  },
  headerTitle: {
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {},
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
    marginLeft: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontWeight: "600",
  },
  sectionContent: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
    lineHeight: 22,
  },
  featureDescription: {},
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 76,
  },
});
