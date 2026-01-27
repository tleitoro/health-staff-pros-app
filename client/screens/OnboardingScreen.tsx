import React, { useState, useRef } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  Pressable,
  Platform,
  FlatList,
  ViewToken,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { BrandColors, Spacing } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const ONBOARDING_KEY = "hasSeenOnboarding";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface OnboardingSlide {
  id: string;
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
  color: string;
}

const slides: OnboardingSlide[] = [
  {
    id: "1",
    icon: "smartphone",
    title: "Welcome to Health Staff Pros",
    description: "Your complete healthcare staffing companion with powerful native features designed for busy healthcare professionals.",
    color: BrandColors.primary,
  },
  {
    id: "2",
    icon: "shield",
    title: "Biometric Login",
    description: "Sign in instantly with Face ID or Touch ID. Your credentials are stored securely using iOS Keychain encryption.",
    color: "#34C759",
  },
  {
    id: "3",
    icon: "bell",
    title: "Push Notifications",
    description: "Get instant alerts for new shifts, messages from facilities, and important schedule updates - even when the app is closed.",
    color: "#FF9500",
  },
  {
    id: "4",
    icon: "camera",
    title: "Document Scanner",
    description: "Use your camera to scan and upload licenses, certifications, and employment documents with automatic edge detection.",
    color: "#AF52DE",
  },
  {
    id: "5",
    icon: "calendar",
    title: "Calendar Sync",
    description: "Sync your work shifts directly to your device calendar. Never miss an assignment with automatic reminders.",
    color: "#FF2D55",
  },
  {
    id: "6",
    icon: "wifi-off",
    title: "Offline Schedule",
    description: "Access your upcoming shifts even without internet. Perfect for facilities with limited connectivity.",
    color: "#5856D6",
  },
  {
    id: "7",
    icon: "users",
    title: "Easy Referrals",
    description: "Refer colleagues directly from your contacts and earn bonuses when they join Health Staff Pros.",
    color: "#00C7BE",
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useSharedValue(0);

  const handleSkip = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    navigation.reset({
      index: 0,
      routes: [{ name: "WebView" }],
    });
  };

  const handleNext = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      handleSkip();
    }
  };

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const renderSlide = ({ item, index }: { item: OnboardingSlide; index: number }) => (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      <View style={[styles.iconContainer, { backgroundColor: item.color + "20" }]}>
        <Feather name={item.icon} size={80} color={item.color} />
      </View>
      <ThemedText style={styles.title}>{item.title}</ThemedText>
      <ThemedText style={styles.description}>{item.description}</ThemedText>
    </View>
  );

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {slides.map((_, index) => {
        const isActive = index === currentIndex;
        return (
          <View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor: isActive ? BrandColors.primary : "#D1D5DB",
                width: isActive ? 24 : 8,
              },
            ]}
          />
        );
      })}
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Pressable onPress={handleSkip} style={styles.skipButton}>
          <ThemedText style={styles.skipText}>Skip</ThemedText>
        </Pressable>
      </View>

      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        bounces={false}
      />

      {renderDots()}

      <View style={styles.footer}>
        <Pressable
          style={[styles.button, { backgroundColor: BrandColors.primary }]}
          onPress={handleNext}
        >
          <ThemedText style={styles.buttonText}>
            {currentIndex === slides.length - 1 ? "Get Started" : "Next"}
          </ThemedText>
          <Feather
            name={currentIndex === slides.length - 1 ? "check" : "arrow-right"}
            size={20}
            color="#FFFFFF"
            style={{ marginLeft: 8 }}
          />
        </Pressable>
      </View>
    </View>
  );
}

export async function checkOnboardingStatus(): Promise<boolean> {
  try {
    const hasSeenOnboarding = await AsyncStorage.getItem(ONBOARDING_KEY);
    return hasSeenOnboarding === "true";
  } catch {
    return false;
  }
}

export async function resetOnboarding(): Promise<void> {
  await AsyncStorage.removeItem(ONBOARDING_KEY);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  skipButton: {
    padding: Spacing.sm,
  },
  skipText: {
    fontSize: 16,
    color: "#6B7280",
  },
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: Spacing.md,
    color: "#1A1A1A",
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    color: "#6B7280",
    lineHeight: 24,
    paddingHorizontal: Spacing.md,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Spacing.lg,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
