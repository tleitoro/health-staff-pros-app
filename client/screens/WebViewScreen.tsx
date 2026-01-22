import React, { useRef, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  Pressable,
  Linking,
  Text,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";

import { useTheme } from "@/hooks/useTheme";
import { BrandColors, Spacing } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

const BIOMETRIC_CREDENTIALS_KEY = "healthstaffpros_biometric_credentials";

let WebView: any = null;
let WebViewNavigation: any = null;
if (Platform.OS !== "web") {
  const webViewModule = require("react-native-webview");
  WebView = webViewModule.WebView;
  WebViewNavigation = webViewModule.WebViewNavigation;
}

const WEB_URL = "https://healthstaffpros.com";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

function WebFallbackScreen() {
  return (
    <View style={webFallbackStyles.container}>
      <View style={webFallbackStyles.content}>
        <Feather name="smartphone" size={64} color={BrandColors.primary} />
        <Text style={webFallbackStyles.title}>
          Mobile App Only
        </Text>
        <Text style={webFallbackStyles.text}>
          This app is designed for iOS and Android devices. Please scan the QR code with Expo Go to use the app on your phone.
        </Text>
        <Pressable
          style={webFallbackStyles.button}
          onPress={() => Linking.openURL(WEB_URL)}
        >
          <Text style={webFallbackStyles.buttonText}>
            Visit Website
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const webFallbackStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#FFFFFF",
  },
  content: {
    alignItems: "center",
    maxWidth: 400,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 12,
    textAlign: "center",
    color: "#1A1A1A",
  },
  text: {
    fontSize: 16,
    textAlign: "center",
    color: "#666666",
    lineHeight: 24,
    marginBottom: 24,
  },
  button: {
    backgroundColor: BrandColors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default function WebViewScreen() {
  if (Platform.OS === "web") {
    return <WebFallbackScreen />;
  }

  return <NativeWebViewScreen />;
}

function NativeWebViewScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const webViewRef = useRef<typeof WebView>(null);

  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(WEB_URL);
  const [refreshing, setRefreshing] = useState(false);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [webViewKey, setWebViewKey] = useState(1);

  const progressWidth = useSharedValue(0);
  const progressOpacity = useSharedValue(1);
  const backToTopOpacity = useSharedValue(0);

  const handleNavigationStateChange = useCallback(
    (navState: typeof WebViewNavigation) => {
      setCanGoBack(navState.canGoBack);
      setCanGoForward(navState.canGoForward);
      setCurrentUrl(navState.url);
    },
    []
  );

  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
    setHasError(false);
    progressOpacity.value = withTiming(1, { duration: 100 });
  }, [progressOpacity]);

  const handleLoadEnd = useCallback(() => {
    setIsLoading(false);
    setRefreshing(false);
    progressOpacity.value = withTiming(0, { duration: 300 });
  }, [progressOpacity]);

  const handleLoadProgress = useCallback(
    ({ nativeEvent }: { nativeEvent: { progress: number } }) => {
      setLoadProgress(nativeEvent.progress);
      progressWidth.value = withSpring(nativeEvent.progress * 100, {
        damping: 15,
        stiffness: 100,
      });
    },
    [progressWidth]
  );

  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoading(false);
    navigation.navigate("Error", { url: currentUrl });
  }, [currentUrl, navigation]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    webViewRef.current?.reload();
  }, []);

  const handleGoBack = useCallback(() => {
    if (canGoBack) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      webViewRef.current?.goBack();
    }
  }, [canGoBack]);

  const handleGoForward = useCallback(() => {
    if (canGoForward) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      webViewRef.current?.goForward();
    }
  }, [canGoForward]);

  const handleScrollToTop = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    webViewRef.current?.injectJavaScript("window.scrollTo(0, 0); true;");
  }, []);

  const handleScroll = useCallback(
    (event: { nativeEvent: { contentOffset: { y: number } } }) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      setScrollOffset(offsetY);
      backToTopOpacity.value = withTiming(offsetY > 300 ? 1 : 0, {
        duration: 200,
      });
    },
    [backToTopOpacity]
  );

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
    opacity: progressOpacity.value,
  }));

  const backToTopStyle = useAnimatedStyle(() => ({
    opacity: backToTopOpacity.value,
    transform: [
      {
        scale: interpolate(
          backToTopOpacity.value,
          [0, 1],
          [0.8, 1],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  const injectedJavaScriptBeforeContentLoaded = `
    (function() {
      // Mark this as running inside the native app - runs BEFORE page content loads
      window.isHealthStaffProsApp = true;
      window.HealthStaffProsApp = { 
        version: '1.0', 
        platform: '${Platform.OS}',
        hasBiometricBridge: true
      };
      
      // Expose biometric bridge functions for the website to call
      window.requestBiometricLogin = function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'requestBiometricLogin' }));
      };
      
      window.saveBiometricCredentials = function(email, password) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ 
          type: 'saveBiometricCredentials', 
          email: email, 
          password: password 
        }));
      };
      
      window.clearBiometricCredentials = function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'clearBiometricCredentials' }));
      };
      
      window.checkBiometricAvailable = function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'checkBiometricAvailable' }));
      };
      
      // Override window.open to handle external URLs (like PDFs) in device browser
      var originalWindowOpen = window.open;
      window.open = function(url, target, features) {
        if (url && window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ 
            type: 'openExternalUrl', 
            url: url 
          }));
          return null;
        }
        return originalWindowOpen ? originalWindowOpen.call(window, url, target, features) : null;
      };
      
      // Prevent beforeinstallprompt event early
      window.addEventListener('beforeinstallprompt', function(e) {
        e.preventDefault();
        return false;
      });
      
      true;
    })();
  `;

  const injectedJavaScript = `
    (function() {
      // Reinforce native app markers
      window.isHealthStaffProsApp = true;
      window.HealthStaffProsApp = { version: '1.0', platform: '${Platform.OS}' };
      
      // Disable zoom
      var meta = document.createElement('meta');
      meta.setAttribute('name', 'viewport');
      meta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
      document.getElementsByTagName('head')[0].appendChild(meta);
      
      // Hide PWA install prompts if they exist
      var style = document.createElement('style');
      style.textContent = '.pwa-install-prompt, .app-install-banner, [data-pwa-install], .install-app-prompt, .add-to-home-screen, .install-banner { display: none !important; }';
      document.head.appendChild(style);
      
      // Track scroll position
      window.addEventListener('scroll', function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'scroll',
          offsetY: window.scrollY
        }));
      });
      
      // Watch for success toast/notification about profile picture update
      var profileUpdateDetected = false;
      var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          mutation.addedNodes.forEach(function(node) {
            if (node.nodeType === 1) {
              var text = node.textContent || '';
              if ((text.toLowerCase().includes('profile picture') && text.toLowerCase().includes('updated')) ||
                  (text.toLowerCase().includes('profile') && text.toLowerCase().includes('success')) ||
                  (text.toLowerCase().includes('photo') && text.toLowerCase().includes('updated'))) {
                if (!profileUpdateDetected) {
                  profileUpdateDetected = true;
                  // Notify app to reload after a delay
                  setTimeout(function() {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'profileUpdated'
                    }));
                    profileUpdateDetected = false;
                  }, 1500);
                }
              }
            }
          });
        });
      });
      observer.observe(document.body, { childList: true, subtree: true });
      
      true;
    })();
  `;

  const handleBiometricLogin = useCallback(async () => {
    try {
      // Check if biometrics are available
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (!hasHardware || !isEnrolled) {
        webViewRef.current?.injectJavaScript(`
          if (window.onBiometricLoginResult) {
            window.onBiometricLoginResult(false, null, null, 'Biometric authentication is not available on this device');
          }
          true;
        `);
        return;
      }

      // Check if we have stored credentials
      const storedCredentials = await SecureStore.getItemAsync(BIOMETRIC_CREDENTIALS_KEY);
      
      if (!storedCredentials) {
        webViewRef.current?.injectJavaScript(`
          if (window.onBiometricLoginResult) {
            window.onBiometricLoginResult(false, null, null, 'No saved credentials. Please log in with email first, then enable biometric login in settings.');
          }
          true;
        `);
        return;
      }

      // Perform biometric authentication
      const authResult = await LocalAuthentication.authenticateAsync({
        promptMessage: "Sign in to Health Staff Pros",
        fallbackLabel: "Use password",
        disableDeviceFallback: false,
      });

      if (authResult.success) {
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        const credentials = JSON.parse(storedCredentials);
        webViewRef.current?.injectJavaScript(`
          if (window.onBiometricLoginResult) {
            window.onBiometricLoginResult(true, '${credentials.email}', '${credentials.password}', null);
          }
          true;
        `);
      } else {
        webViewRef.current?.injectJavaScript(`
          if (window.onBiometricLoginResult) {
            window.onBiometricLoginResult(false, null, null, 'Authentication cancelled or failed');
          }
          true;
        `);
      }
    } catch (error) {
      console.error("Biometric login error:", error);
      webViewRef.current?.injectJavaScript(`
        if (window.onBiometricLoginResult) {
          window.onBiometricLoginResult(false, null, null, 'An error occurred during authentication');
        }
        true;
      `);
    }
  }, []);

  const handleSaveBiometricCredentials = useCallback(async (email: string, password: string) => {
    try {
      await SecureStore.setItemAsync(
        BIOMETRIC_CREDENTIALS_KEY,
        JSON.stringify({ email, password })
      );
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      webViewRef.current?.injectJavaScript(`
        if (window.onBiometricCredentialsSaved) {
          window.onBiometricCredentialsSaved(true, null);
        }
        true;
      `);
    } catch (error) {
      console.error("Save credentials error:", error);
      webViewRef.current?.injectJavaScript(`
        if (window.onBiometricCredentialsSaved) {
          window.onBiometricCredentialsSaved(false, 'Failed to save credentials');
        }
        true;
      `);
    }
  }, []);

  const handleMessage = useCallback(
    (event: { nativeEvent: { data: string } }) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === "scroll") {
          backToTopOpacity.value = withTiming(data.offsetY > 300 ? 1 : 0, {
            duration: 200,
          });
        } else if (data.type === "profileUpdated") {
          // Force remount WebView to clear all caches including image cache
          setWebViewKey(prev => prev + 1);
        } else if (data.type === "requestBiometricLogin") {
          // Handle biometric login request from website
          handleBiometricLogin();
        } else if (data.type === "saveBiometricCredentials") {
          // Save credentials for biometric login
          if (data.email && data.password) {
            handleSaveBiometricCredentials(data.email, data.password);
          }
        } else if (data.type === "clearBiometricCredentials") {
          // Clear stored biometric credentials
          SecureStore.deleteItemAsync(BIOMETRIC_CREDENTIALS_KEY);
        } else if (data.type === "checkBiometricAvailable") {
          // Check if biometric is available and has stored credentials
          (async () => {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();
            const storedCredentials = await SecureStore.getItemAsync(BIOMETRIC_CREDENTIALS_KEY);
            webViewRef.current?.injectJavaScript(`
              if (window.onBiometricAvailabilityResult) {
                window.onBiometricAvailabilityResult(${hasHardware && isEnrolled}, ${!!storedCredentials});
              }
              true;
            `);
          })();
        } else if (data.type === "openExternalUrl") {
          // Open external URLs (like PDFs) in the device's default browser
          if (data.url) {
            Linking.openURL(data.url);
          }
        } else if (data.type === "shareFile") {
          // Handle file sharing (timesheets, documents) via native share sheet
          (async () => {
            try {
              const { url, fileName, mimeType, title } = data;
              if (!url) {
                Alert.alert("Error", "No file URL provided");
                return;
              }
              
              // Generate filename if not provided
              const safeFileName = fileName || `timesheet_${Date.now()}.pdf`;
              
              // Download the file to local cache
              const localUri = `${FileSystem.documentDirectory}${safeFileName}`;
              const downloadResult = await FileSystem.downloadAsync(url, localUri);
              
              if (downloadResult.status === 200) {
                // Check if sharing is available
                const isAvailable = await Sharing.isAvailableAsync();
                
                if (isAvailable) {
                  await Sharing.shareAsync(downloadResult.uri, {
                    mimeType: mimeType || "application/pdf",
                    dialogTitle: title || "Share Timesheet",
                  });
                } else {
                  // Fallback to opening in browser
                  Linking.openURL(url);
                }
              } else {
                // If download fails, try opening in browser as fallback
                Alert.alert(
                  "Download Issue",
                  "Opening in browser instead...",
                  [{ text: "OK", onPress: () => Linking.openURL(url) }]
                );
              }
            } catch (error: any) {
              // Fallback to opening in browser
              const url = data.url;
              if (url) {
                Linking.openURL(url);
              } else {
                Alert.alert("Error", "Could not open the file.");
              }
            }
          })();
        } else if (data.type === "openPdf" || data.type === "viewTimesheet") {
          // Alternative message types - open directly in browser
          if (data.url) {
            Linking.openURL(data.url);
          }
        }
      } catch (e) {
        // Ignore non-JSON messages
      }
    },
    [backToTopOpacity, handleBiometricLogin, handleSaveBiometricCredentials]
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <Animated.View
        style={[
          styles.progressBar,
          { backgroundColor: BrandColors.primary, top: insets.top },
          progressBarStyle,
        ]}
      />

      <WebView
        key={webViewKey}
        ref={webViewRef}
        source={{ uri: WEB_URL }}
        style={[styles.webView, { marginTop: insets.top }]}
        onNavigationStateChange={handleNavigationStateChange}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onLoadProgress={handleLoadProgress}
        onError={handleError}
        onHttpError={handleError}
        onMessage={handleMessage}
        injectedJavaScriptBeforeContentLoaded={injectedJavaScriptBeforeContentLoaded}
        injectedJavaScript={injectedJavaScript}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        cacheEnabled={true}
        pullToRefreshEnabled={Platform.OS !== "web"}
        allowsBackForwardNavigationGestures={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        startInLoadingState={true}
        userAgent={
          Platform.OS === "ios"
            ? "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1 HealthStaffProsApp/1.0"
            : Platform.OS === "android"
              ? "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 HealthStaffProsApp/1.0"
              : undefined
        }
        applicationNameForUserAgent="HealthStaffProsApp/1.0"
        allowFileAccess={true}
        allowFileAccessFromFileURLs={true}
        allowUniversalAccessFromFileURLs={true}
        allowsFullscreenVideo={true}
        overScrollMode="never"
        scalesPageToFit={true}
        cacheMode="LOAD_DEFAULT"
        incognito={false}
        renderLoading={() => (
          <View
            style={[
              styles.loadingContainer,
              { backgroundColor: theme.backgroundRoot },
            ]}
          >
            <ActivityIndicator size="large" color={BrandColors.primary} />
          </View>
        )}
        contentInset={{ bottom: insets.bottom }}
        automaticallyAdjustContentInsets={false}
      />

      <Animated.View
        style={[
          styles.backToTopButton,
          {
            bottom: insets.bottom + Spacing.xl,
            backgroundColor: BrandColors.primary,
          },
          backToTopStyle,
        ]}
      >
        <Pressable
          onPress={handleScrollToTop}
          style={styles.backToTopPressable}
          hitSlop={8}
        >
          <Feather name="arrow-up" size={20} color="#FFFFFF" />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webView: {
    flex: 1,
  },
  progressBar: {
    position: "absolute",
    left: 0,
    height: 3,
    zIndex: 100,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  backToTopButton: {
    position: "absolute",
    right: Spacing.lg,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  backToTopPressable: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
});
