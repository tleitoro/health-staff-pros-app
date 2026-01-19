import React, { useState, useRef, useCallback } from "react";
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
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { BrandColors, Spacing, BorderRadius } from "@/constants/theme";

interface ScannedDocument {
  id: string;
  uri: string;
  type: string;
  date: Date;
}

export default function DocumentScannerScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [scannedDocs, setScannedDocs] = useState<ScannedDocument[]>([]);
  const cameraRef = useRef<CameraView>(null);

  const handleRequestPermission = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const result = await requestPermission();

    if (!result.granted && !result.canAskAgain) {
      Alert.alert(
        "Permission Required",
        "Please enable camera access in Settings to scan documents.",
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

  const takePicture = useCallback(async () => {
    if (!cameraRef.current) return;

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });

      if (photo) {
        const newDoc: ScannedDocument = {
          id: Date.now().toString(),
          uri: photo.uri,
          type: "License/Certificate",
          date: new Date(),
        };
        setScannedDocs((prev) => [newDoc, ...prev]);
        setIsCameraActive(false);

        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        Alert.alert(
          "Document Scanned",
          "Your document has been captured. You can upload it from your scanned documents."
        );
      }
    } catch (error) {
      console.error("Error taking picture:", error);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      Alert.alert("Error", "Could not capture document. Please try again.");
    }
  }, []);

  const pickImage = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const newDoc: ScannedDocument = {
        id: Date.now().toString(),
        uri: result.assets[0].uri,
        type: "License/Certificate",
        date: new Date(),
      };
      setScannedDocs((prev) => [newDoc, ...prev]);

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  };

  if (Platform.OS === "web") {
    return (
      <ThemedView style={styles.container}>
        <View
          style={[styles.content, { paddingTop: headerHeight + Spacing.xl }]}
        >
          <View style={[styles.iconCircle, { backgroundColor: "#FF950015" }]}>
            <Feather name="smartphone" size={48} color="#FF9500" />
          </View>
          <ThemedText type="h3" style={styles.title}>
            Mobile Feature
          </ThemedText>
          <ThemedText
            type="body"
            style={[styles.subtitle, { color: theme.textSecondary }]}
          >
            Document scanning is available when using the app on your mobile
            device. Scan the QR code in Expo Go to access this feature.
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (!permission) {
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

  if (!permission.granted) {
    return (
      <ThemedView style={styles.container}>
        <View
          style={[styles.content, { paddingTop: headerHeight + Spacing.xl }]}
        >
          <View style={[styles.iconCircle, { backgroundColor: "#FF950015" }]}>
            <Feather name="camera" size={48} color="#FF9500" />
          </View>
          <ThemedText type="h3" style={styles.title}>
            Camera Access
          </ThemedText>
          <ThemedText
            type="body"
            style={[styles.subtitle, { color: theme.textSecondary }]}
          >
            Allow camera access to scan your licenses, certifications, and other
            documents.
          </ThemedText>

          <Pressable
            onPress={handleRequestPermission}
            style={[styles.button, { backgroundColor: BrandColors.primary }]}
            testID="enable-camera-button"
          >
            <Feather name="camera" size={20} color="#FFFFFF" />
            <ThemedText style={styles.buttonText}>Enable Camera</ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    );
  }

  if (isCameraActive) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
        >
          <View style={[styles.cameraOverlay, { paddingTop: insets.top }]}>
            <Pressable
              onPress={() => setIsCameraActive(false)}
              style={styles.closeButton}
            >
              <Feather name="x" size={24} color="#FFFFFF" />
            </Pressable>
          </View>

          <View style={styles.scanFrame}>
            <View style={[styles.scanCorner, styles.topLeft]} />
            <View style={[styles.scanCorner, styles.topRight]} />
            <View style={[styles.scanCorner, styles.bottomLeft]} />
            <View style={[styles.scanCorner, styles.bottomRight]} />
          </View>

          <View
            style={[styles.cameraControls, { paddingBottom: insets.bottom + Spacing.lg }]}
          >
            <ThemedText style={styles.cameraHint}>
              Position document within the frame
            </ThemedText>
            <Pressable
              onPress={takePicture}
              style={styles.captureButton}
              testID="capture-button"
            >
              <View style={styles.captureButtonInner} />
            </Pressable>
          </View>
        </CameraView>
      </View>
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
        <View style={styles.actionButtons}>
          <Pressable
            onPress={() => setIsCameraActive(true)}
            style={[styles.actionButton, { backgroundColor: "#FF950015" }]}
            testID="scan-document-button"
          >
            <Feather name="camera" size={28} color="#FF9500" />
            <ThemedText style={styles.actionButtonText}>
              Scan Document
            </ThemedText>
          </Pressable>

          <Pressable
            onPress={pickImage}
            style={[styles.actionButton, { backgroundColor: "#5856D615" }]}
            testID="upload-image-button"
          >
            <Feather name="image" size={28} color="#5856D6" />
            <ThemedText style={styles.actionButtonText}>
              From Photos
            </ThemedText>
          </Pressable>
        </View>

        <ThemedText
          type="small"
          style={[styles.sectionTitle, { color: theme.textSecondary }]}
        >
          SCANNED DOCUMENTS
        </ThemedText>

        {scannedDocs.length === 0 ? (
          <View
            style={[
              styles.emptyState,
              { backgroundColor: theme.backgroundDefault },
            ]}
          >
            <Feather name="file-text" size={32} color={theme.textTertiary} />
            <ThemedText
              type="body"
              style={[styles.emptyText, { color: theme.textSecondary }]}
            >
              No documents scanned yet
            </ThemedText>
            <ThemedText
              type="small"
              style={{ color: theme.textTertiary, textAlign: "center" }}
            >
              Scan your licenses, certifications, and credentials to keep them
              handy
            </ThemedText>
          </View>
        ) : (
          scannedDocs.map((doc) => (
            <View
              key={doc.id}
              style={[styles.docCard, { backgroundColor: theme.backgroundDefault }]}
            >
              <Image source={{ uri: doc.uri }} style={styles.docThumbnail} />
              <View style={styles.docInfo}>
                <ThemedText style={styles.docType}>{doc.type}</ThemedText>
                <ThemedText
                  type="small"
                  style={{ color: theme.textSecondary }}
                >
                  {doc.date.toLocaleDateString()}
                </ThemedText>
              </View>
              <Pressable
                onPress={() => {
                  if (Platform.OS !== "web") {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  Alert.alert(
                    "Upload Document",
                    "This document will be uploaded to your Health Staff Pros profile.",
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Upload",
                        onPress: () => {
                          if (Platform.OS !== "web") {
                            Haptics.notificationAsync(
                              Haptics.NotificationFeedbackType.Success
                            );
                          }
                          Alert.alert("Success", "Document uploaded successfully!");
                        },
                      },
                    ]
                  );
                }}
                style={[styles.uploadButton, { backgroundColor: BrandColors.primary }]}
              >
                <Feather name="upload" size={16} color="#FFFFFF" />
              </Pressable>
            </View>
          ))
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
  actionButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  actionButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  actionButtonText: {
    fontWeight: "600",
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
  emptyText: {
    fontWeight: "500",
  },
  docCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  docThumbnail: {
    width: 60,
    height: 80,
    borderRadius: BorderRadius.xs,
  },
  docInfo: {
    flex: 1,
    gap: 2,
  },
  docType: {
    fontWeight: "600",
  },
  uploadButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
    zIndex: 10,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  scanFrame: {
    position: "absolute",
    top: "25%",
    left: "10%",
    right: "10%",
    aspectRatio: 0.7,
  },
  scanCorner: {
    position: "absolute",
    width: 30,
    height: 30,
    borderColor: "#FFFFFF",
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  cameraControls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    gap: Spacing.lg,
  },
  cameraHint: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FFFFFF",
  },
});
