import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  Alert,
  Platform,
  Switch,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as LocalAuthentication from "expo-local-authentication";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { BrandColors, Spacing, BorderRadius } from "@/constants/theme";

const BIOMETRIC_ENABLED_KEY = "@biometric_enabled";

export default function BiometricAuthScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  const [isSupported, setIsSupported] = useState(false);
  const [biometricType, setBiometricType] = useState<string>("Biometric");
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkBiometricSupport();
    loadSettings();
  }, []);

  const checkBiometricSupport = async () => {
    if (Platform.OS === "web") {
      setIsLoading(false);
      return;
    }

    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    setIsSupported(hasHardware && isEnrolled);

    const supportedTypes =
      await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (
      supportedTypes.includes(
        LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
      )
    ) {
      setBiometricType("Face ID");
    } else if (
      supportedTypes.includes(
        LocalAuthentication.AuthenticationType.FINGERPRINT
      )
    ) {
      setBiometricType("Touch ID");
    }

    setIsLoading(false);
  };

  const loadSettings = async () => {
    try {
      const enabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
      setIsEnabled(enabled === "true");
    } catch (error) {
      console.error("Error loading biometric settings:", error);
    }
  };

  const handleToggle = useCallback(async (value: boolean) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (value) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Verify your identity to enable biometric login",
        fallbackLabel: "Use passcode",
      });

      if (result.success) {
        setIsEnabled(true);
        await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, "true");
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        Alert.alert(
          "Biometric Login Enabled",
          "You can now use " + biometricType + " to sign in quickly."
        );
      } else {
        Alert.alert(
          "Authentication Failed",
          "Please try again to enable biometric login."
        );
      }
    } else {
      setIsEnabled(false);
      await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, "false");
    }
  }, [biometricType]);

  const handleTestAuth = useCallback(async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Test " + biometricType + " authentication",
      fallbackLabel: "Use passcode",
    });

    if (result.success) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert("Success", "Authentication successful!");
    } else {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      Alert.alert("Failed", result.error || "Authentication failed");
    }
  }, [biometricType]);

  if (Platform.OS === "web") {
    return (
      <ThemedView style={styles.container}>
        <View
          style={[
            styles.content,
            { paddingTop: headerHeight + Spacing.xl },
          ]}
        >
          <View style={[styles.iconCircle, { backgroundColor: "#007AFF15" }]}>
            <Feather name="smartphone" size={48} color="#007AFF" />
          </View>
          <ThemedText type="h3" style={styles.title}>
            Mobile Feature
          </ThemedText>
          <ThemedText
            type="body"
            style={[styles.subtitle, { color: theme.textSecondary }]}
          >
            Biometric login is available when using the app on your mobile
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

  if (!isSupported) {
    return (
      <ThemedView style={styles.container}>
        <View
          style={[
            styles.content,
            { paddingTop: headerHeight + Spacing.xl },
          ]}
        >
          <View style={[styles.iconCircle, { backgroundColor: "#FF950015" }]}>
            <Feather name="alert-circle" size={48} color="#FF9500" />
          </View>
          <ThemedText type="h3" style={styles.title}>
            Not Available
          </ThemedText>
          <ThemedText
            type="body"
            style={[styles.subtitle, { color: theme.textSecondary }]}
          >
            Biometric authentication is not set up on this device. Please enable
            Face ID or Touch ID in your device settings.
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View
        style={[
          styles.content,
          { paddingTop: headerHeight + Spacing.xl, paddingBottom: insets.bottom + Spacing.xl },
        ]}
      >
        <View style={[styles.iconCircle, { backgroundColor: "#007AFF15" }]}>
          <Feather
            name={biometricType === "Face ID" ? "eye" : "unlock"}
            size={48}
            color="#007AFF"
          />
        </View>
        <ThemedText type="h3" style={styles.title}>
          {biometricType}
        </ThemedText>
        <ThemedText
          type="body"
          style={[styles.subtitle, { color: theme.textSecondary }]}
        >
          Sign in quickly and securely using {biometricType}
        </ThemedText>

        <View
          style={[
            styles.settingCard,
            { backgroundColor: theme.backgroundDefault },
          ]}
        >
          <View style={styles.settingRow}>
            <View style={styles.settingContent}>
              <ThemedText style={styles.settingTitle}>
                Enable {biometricType}
              </ThemedText>
              <ThemedText
                type="small"
                style={{ color: theme.textSecondary }}
              >
                Use {biometricType} to sign in to the app
              </ThemedText>
            </View>
            <Switch
              value={isEnabled}
              onValueChange={handleToggle}
              trackColor={{ false: theme.border, true: BrandColors.primary }}
              thumbColor="#FFFFFF"
              testID="biometric-toggle"
            />
          </View>
        </View>

        {isEnabled ? (
          <Pressable
            onPress={handleTestAuth}
            style={[styles.testButton, { backgroundColor: BrandColors.primary }]}
            testID="test-biometric-button"
          >
            <Feather name="check-circle" size={20} color="#FFFFFF" />
            <ThemedText style={styles.testButtonText}>
              Test {biometricType}
            </ThemedText>
          </Pressable>
        ) : null}
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
  settingCard: {
    width: "100%",
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontWeight: "600",
    marginBottom: 2,
  },
  testButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    marginTop: Spacing.xl,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing["2xl"],
    borderRadius: BorderRadius.md,
  },
  testButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
});
