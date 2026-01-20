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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { HeaderButton, useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
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
  const navigation = useNavigation<NavigationProp>();

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
          <HeaderButton onPress={() => navigation.navigate("Features")} testID="header-features-button">
            <Feather name="grid" size={22} color={BrandColors.primary} />
          </HeaderButton>
          <HeaderButton onPress={() => navigation.navigate("Settings")} testID="header-settings-button">
            <Feather name="settings" size={22} color="#1A1A1A" />
          </HeaderButton>
        </View>
      ),
    });
  }, [navigation]);

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
        <View style={webFallbackStyles.buttonRow}>
          <Pressable
            style={webFallbackStyles.button}
            onPress={() => Linking.openURL(WEB_URL)}
          >
            <Text style={webFallbackStyles.buttonText}>
              Visit Website
            </Text>
          </Pressable>
          <Pressable
            style={webFallbackStyles.buttonSecondary}
            onPress={() => navigation.navigate("Features")}
          >
            <Text style={webFallbackStyles.buttonSecondaryText}>
              View Features
            </Text>
          </Pressable>
        </View>
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
  buttonRow: {
    flexDirection: "row",
    gap: 12,
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
  buttonSecondary: {
    backgroundColor: "#F0F0F0",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonSecondaryText: {
    color: BrandColors.primary,
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
  const headerHeight = useHeaderHeight();
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

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () =>
        canGoBack ? (
          <HeaderButton onPress={handleGoBack} testID="header-back-button">
            <Feather name="chevron-left" size={24} color={theme.text} />
          </HeaderButton>
        ) : null,
      headerRight: () => (
        <View style={styles.headerRightContainer}>
          {canGoForward ? (
            <HeaderButton onPress={handleGoForward} testID="header-forward-button">
              <Feather name="chevron-right" size={24} color={theme.text} />
            </HeaderButton>
          ) : null}
          <HeaderButton onPress={() => navigation.navigate("Features")} testID="header-features-button">
            <Feather name="grid" size={22} color={BrandColors.primary} />
          </HeaderButton>
          <HeaderButton onPress={() => navigation.navigate("Settings")} testID="header-settings-button">
            <Feather name="settings" size={22} color={theme.text} />
          </HeaderButton>
        </View>
      ),
    });
  }, [
    navigation,
    canGoBack,
    canGoForward,
    handleGoBack,
    handleGoForward,
    theme.text,
  ]);

  const injectedJavaScriptBeforeContentLoaded = `
    (function() {
      // Mark this as running inside the native app - runs BEFORE page content loads
      window.isHealthStaffProsApp = true;
      window.HealthStaffProsApp = { version: '1.0', platform: '${Platform.OS}' };
      
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

  const handleMessage = useCallback(
    (event: { nativeEvent: { data: string } }) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === "scroll") {
          backToTopOpacity.value = withTiming(data.offsetY > 300 ? 1 : 0, {
            duration: 200,
          });
        } else if (data.type === "profileUpdated") {
          // Clear cache and force a hard reload to show updated profile image
          if (webViewRef.current) {
            // First clear the cache by injecting JavaScript
            webViewRef.current.injectJavaScript(`
              // Clear image cache by forcing reload with cache bust
              document.querySelectorAll('img').forEach(function(img) {
                var src = img.src;
                if (src && !src.includes('data:')) {
                  var newSrc = src.split('?')[0] + '?t=' + Date.now();
                  img.src = newSrc;
                }
              });
              // Force location reload
              window.location.reload(true);
              true;
            `);
          }
        }
      } catch (e) {
        // Ignore non-JSON messages
      }
    },
    [backToTopOpacity]
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <Animated.View
        style={[
          styles.progressBar,
          { backgroundColor: BrandColors.primary, top: headerHeight },
          progressBarStyle,
        ]}
      />

      <WebView
        ref={webViewRef}
        source={{ uri: WEB_URL }}
        style={[styles.webView, { marginTop: headerHeight }]}
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
  headerRightContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
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
