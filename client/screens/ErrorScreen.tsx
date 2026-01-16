import React, { useCallback } from "react";
import { View, StyleSheet, Image, Pressable, Linking, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { BrandColors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type ErrorScreenRouteProp = RouteProp<RootStackParamList, "Error">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function ErrorScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ErrorScreenRouteProp>();

  const retryScale = useSharedValue(1);
  const settingsScale = useSharedValue(1);

  const handleRetry = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.goBack();
  }, [navigation]);

  const handleCheckConnection = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (Platform.OS === "ios") {
      Linking.openURL("App-Prefs:WIFI");
    } else if (Platform.OS === "android") {
      Linking.openSettings();
    }
  }, []);

  const retryAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: retryScale.value }],
  }));

  const settingsAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: settingsScale.value }],
  }));

  return (
    <ThemedView style={styles.container}>
      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + Spacing["3xl"],
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
      >
        <View style={styles.illustrationContainer}>
          <Image
            source={require("../../assets/images/error-network.png")}
            style={styles.illustration}
            resizeMode="contain"
          />
        </View>

        <View style={styles.textContainer}>
          <ThemedText type="h3" style={styles.title}>
            Connection Lost
          </ThemedText>
          <ThemedText
            type="body"
            style={[styles.description, { color: theme.textSecondary }]}
          >
            We couldn't connect to Health Staff Pros. Please check your internet
            connection and try again.
          </ThemedText>
        </View>

        <View style={styles.buttonContainer}>
          <AnimatedPressable
            onPress={handleRetry}
            onPressIn={() => {
              retryScale.value = withSpring(0.96);
            }}
            onPressOut={() => {
              retryScale.value = withSpring(1);
            }}
            style={[
              styles.primaryButton,
              { backgroundColor: BrandColors.primary },
              retryAnimatedStyle,
            ]}
          >
            <Feather name="refresh-cw" size={20} color="#FFFFFF" />
            <ThemedText style={styles.primaryButtonText}>Try Again</ThemedText>
          </AnimatedPressable>

          {Platform.OS !== "web" ? (
            <AnimatedPressable
              onPress={handleCheckConnection}
              onPressIn={() => {
                settingsScale.value = withSpring(0.96);
              }}
              onPressOut={() => {
                settingsScale.value = withSpring(1);
              }}
              style={[
                styles.secondaryButton,
                { borderColor: theme.border },
                settingsAnimatedStyle,
              ]}
            >
              <Feather name="wifi" size={20} color={theme.text} />
              <ThemedText style={styles.secondaryButtonText}>
                Check Connection
              </ThemedText>
            </AnimatedPressable>
          ) : null}
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  illustrationContainer: {
    width: 200,
    height: 200,
    marginBottom: Spacing["3xl"],
  },
  illustration: {
    width: "100%",
    height: "100%",
  },
  textContainer: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  description: {
    textAlign: "center",
    maxWidth: 300,
  },
  buttonContainer: {
    width: "100%",
    maxWidth: 300,
    gap: Spacing.md,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 52,
    borderRadius: BorderRadius.xl,
    gap: Spacing.sm,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 52,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    gap: Spacing.sm,
  },
  secondaryButtonText: {
    fontWeight: "500",
    fontSize: 16,
  },
});
