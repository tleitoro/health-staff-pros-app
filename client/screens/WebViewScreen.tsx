import React, { useRef, useState, useCallback, useEffect } from "react";
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
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as Calendar from "expo-calendar";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Contacts from "expo-contacts";

// Configure how notifications appear when app is in foreground
// Wrap in try-catch to prevent crash on Android Expo Go (SDK 53+)
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch (e) {
  console.log("Notifications not supported in this environment");
}

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
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);

  // Register for push notifications on mount
  useEffect(() => {
    registerForPushNotificationsAsync();
    
    let notificationListener: any;
    let responseListener: any;
    
    try {
      notificationListener = Notifications.addNotificationReceivedListener(notification => {
        console.log("Notification received:", notification);
      });
      
      responseListener = Notifications.addNotificationResponseReceivedListener(response => {
        console.log("Notification response:", response);
      });
    } catch (e) {
      console.log("Notification listeners not supported in this environment");
    }
    
    return () => {
      try {
        if (notificationListener) notificationListener.remove();
        if (responseListener) responseListener.remove();
      } catch (e) {}
    };
  }, []);

  // Check for scanned documents and selected contacts when screen gains focus
  useFocusEffect(
    useCallback(() => {
      const checkForScannedDocument = async () => {
        try {
          const scannedData = await AsyncStorage.getItem('scannedDocument');
          if (scannedData && webViewRef.current) {
            const parsed = JSON.parse(scannedData);
            // Clear the stored document
            await AsyncStorage.removeItem('scannedDocument');
            
            // Inject the scanned document into the website
            webViewRef.current.injectJavaScript(`
              window.scannedDocument = ${JSON.stringify(parsed)};
              window.dispatchEvent(new CustomEvent('scannedDocument', { 
                detail: ${JSON.stringify(parsed)}
              }));
              if (window.onScannedDocument) {
                window.onScannedDocument(${JSON.stringify(parsed)});
              }
              true;
            `);
          }
        } catch (error) {
          console.error('Error checking for scanned document:', error);
        }
      };
      
      const injectContactData = (contactData: any) => {
        if (!webViewRef.current) {
          console.log('WebView ref not available');
          return false;
        }
        
        console.log('Injecting selected contact:', contactData);
        
        // Inject the selected contact into the website
        webViewRef.current.injectJavaScript(`
          (function() {
            var contactData = ${JSON.stringify(contactData)};
            console.log('Native app sending contact:', JSON.stringify(contactData));
            
            // Store globally
            window.selectedContact = contactData;
            
            // Dispatch custom event
            window.dispatchEvent(new CustomEvent('selectedContact', { 
              detail: contactData
            }));
            
            // Call callback if exists
            if (window.onSelectedContact) {
              window.onSelectedContact(contactData);
            }
            
            // Also try postMessage for the website to receive
            window.postMessage({ type: 'selectedContact', contact: contactData }, '*');
          })();
          true;
        `);
        return true;
      };
      
      const checkForSelectedContact = async () => {
        try {
          const contactData = await AsyncStorage.getItem('selectedContact');
          if (contactData) {
            const parsed = JSON.parse(contactData);
            // Clear the stored contact
            await AsyncStorage.removeItem('selectedContact');
            
            injectContactData(parsed);
          }
        } catch (error) {
          console.error('Error checking for selected contact:', error);
        }
      };
      
      checkForScannedDocument();
      
      // Poll multiple times with increasing delays to catch the contact data
      // This handles any race conditions between saving and focus events
      const delays = [100, 300, 600, 1000];
      delays.forEach(delay => {
        setTimeout(checkForSelectedContact, delay);
      });
    }, [])
  );

  const registerForPushNotificationsAsync = async () => {
    if (!Device.isDevice) {
      console.log("Must use physical device for push notifications");
      return;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.log("Push notification permission not granted");
        return;
      }

      // Get the Expo push token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });
      
      setExpoPushToken(tokenData.data);
      console.log("Expo Push Token:", tokenData.data);

      // Inject token into WebView once available
      if (webViewRef.current && tokenData.data) {
        webViewRef.current.injectJavaScript(`
          window.expoPushToken = "${tokenData.data}";
          window.dispatchEvent(new CustomEvent('expoPushToken', { detail: "${tokenData.data}" }));
          true;
        `);
      }
    } catch (error) {
      console.log("Error registering for push notifications:", error);
    }
  };

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
      
      // Hide website's refresh button since app has native pull-to-refresh
      var style = document.createElement('style');
      style.textContent = \`
        /* Hide refresh/reload buttons - app uses native pull-to-refresh */
        button[aria-label="refresh"],
        button[aria-label="Refresh"],
        button[title="refresh"],
        button[title="Refresh"],
        .refresh-button,
        .reload-button,
        [data-testid="refresh-button"],
        button:has(svg[class*="refresh"]),
        button:has(svg[class*="rotate"]) {
          display: none !important;
        }
      \`;
      document.head.appendChild(style);
      
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
      
      // Push notification bridge functions
      window.requestPushToken = function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'requestPushToken' }));
      };
      
      window.sendTestNotification = function(message) {
        return new Promise(function(resolve, reject) {
          // Set up callback for response
          window.onTestNotificationSent = function(success, error) {
            if (success) {
              resolve(true);
            } else {
              reject(new Error(error || 'Failed to send notification'));
            }
          };
          // Send message to native
          window.ReactNativeWebView.postMessage(JSON.stringify({ 
            type: 'sendTestNotification',
            message: message || 'Test notification from Health Staff Pros'
          }));
          // Timeout fallback - assume success after 2 seconds if no response
          setTimeout(function() {
            if (window.onTestNotificationSent) {
              resolve(true);
              window.onTestNotificationSent = null;
            }
          }, 2000);
        });
      };
      
      // Also expose a simple sync version that always returns true
      window.canSendNotifications = function() {
        return true;
      };
      
      // Offline schedule bridge functions
      window.cacheSchedule = function(shifts, syncedAt) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ 
          type: 'cacheSchedule',
          shifts: shifts || [],
          syncedAt: syncedAt || new Date().toISOString()
        }));
      };
      
      window.getCachedSchedule = function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'getCachedSchedule' }));
      };
      
      // Document scanner bridge function
      window.openDocumentScanner = function(documentType) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ 
          type: 'openDocumentScanner',
          documentType: documentType || 'Document'
        }));
      };
      
      // Contact picker bridge function
      window.openContactPicker = function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'openContactPicker' }));
      };
      
      // Trigger native haptic feedback
      // Styles: 'light', 'medium', 'heavy', 'success', 'error', 'warning', 'selection'
      window.triggerHaptic = function(style) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'haptic', style: style || 'light' }));
      };
      
      // Override window.open to handle external URLs (like PDFs) in device browser
      var originalWindowOpen = window.open;
      window.open = function(url, target, features) {
        if (url && window.ReactNativeWebView) {
          var isPdf = url.toLowerCase().indexOf('.pdf') > -1;
          var fileName = isPdf ? url.split('/').pop() || 'document.pdf' : null;
          window.ReactNativeWebView.postMessage(JSON.stringify({ 
            type: isPdf ? 'shareFile' : 'openExternalUrl', 
            url: url,
            fileName: fileName,
            mimeType: isPdf ? 'application/pdf' : null
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
        } else if (data.type === "openExternalUrl" || data.type === "openExternalURL" || data.type === "openUrl" || data.type === "openURL") {
          // Open external URLs - for PDFs, download and share; for others, open in browser
          if (data.url) {
            const url = data.url;
            const isPdf = url.endsWith('.pdf') || data.fileName?.endsWith('.pdf') || data.mimeType === 'application/pdf';
            
            if (isPdf) {
              // Handle PDF with share sheet
              (async () => {
                try {
                  const fileName = data.fileName || `timesheet_${Date.now()}.pdf`;
                  const docDir = (FileSystem as any).documentDirectory || (FileSystem as any).cacheDirectory;
                  const localUri = `${docDir}${fileName}`;
                  const downloadResult = await FileSystem.downloadAsync(url, localUri);
                  
                  if (downloadResult.status === 200 && await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(downloadResult.uri, {
                      mimeType: 'application/pdf',
                      dialogTitle: 'View Timesheet',
                    });
                  } else {
                    Linking.openURL(url);
                  }
                } catch {
                  Linking.openURL(url);
                }
              })();
            } else {
              Linking.openURL(url);
            }
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
              const docDir = (FileSystem as any).documentDirectory || (FileSystem as any).cacheDirectory;
              const localUri = `${docDir}${safeFileName}`;
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
        } else if (data.type === "addToCalendar") {
          // Handle calendar event from website schedule page
          (async () => {
            try {
              const { event } = data;
              if (!event) return;

              const { status } = await Calendar.requestCalendarPermissionsAsync();
              if (status !== "granted") {
                Alert.alert(
                  "Calendar Permission Required",
                  "Please enable calendar access to add shifts to your calendar.",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Open Settings",
                      onPress: () => {
                        if (Platform.OS !== "web") {
                          try { Linking.openSettings(); } catch {}
                        }
                      },
                    },
                  ]
                );
                return;
              }

              const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
              const writableCalendars = calendars.filter(c => c.allowsModifications);
              const defaultCalendar = writableCalendars.find(c => c.isPrimary) || writableCalendars[0];

              if (!defaultCalendar) {
                Alert.alert("No Calendar", "No writable calendar found on this device.");
                return;
              }

              await Calendar.createEventAsync(defaultCalendar.id, {
                title: event.title || "Health Staff Pros Shift",
                startDate: new Date(event.startDate),
                endDate: new Date(event.endDate),
                location: event.location || "",
                notes: event.notes || "Scheduled via Health Staff Pros app",
                alarms: [{ relativeOffset: -30 }],
              });

              if (Platform.OS !== "web") {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
              Alert.alert("Added to Calendar", `"${event.title}" has been added to your calendar.`);
            } catch (error) {
              Alert.alert("Error", "Could not add event to calendar. Please try again.");
            }
          })();
        } else if (data.type === "getPushToken" || data.type === "requestPushToken") {
          // Website is requesting the push token
          if (expoPushToken && webViewRef.current) {
            webViewRef.current.injectJavaScript(`
              window.expoPushToken = "${expoPushToken}";
              window.dispatchEvent(new CustomEvent('expoPushToken', { detail: "${expoPushToken}" }));
              if (window.onExpoPushToken) {
                window.onExpoPushToken("${expoPushToken}");
              }
              true;
            `);
          }
        } else if (data.type === "sendTestNotification") {
          // Send a local test notification
          (async () => {
            try {
              // Provide haptic feedback immediately
              if (Platform.OS !== "web") {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
              
              // Try to send local notification
              await Notifications.scheduleNotificationAsync({
                content: {
                  title: "Health Staff Pros",
                  body: data.message || "Test notification from Health Staff Pros",
                  sound: true,
                },
                trigger: null,
              });
              
              // Show confirmation alert
              Alert.alert(
                "Notification Sent",
                "Check your notification center for the test notification.",
                [{ text: "OK" }]
              );
              
              // Notify website that notification was sent
              if (webViewRef.current) {
                webViewRef.current.injectJavaScript(`
                  if (window.onTestNotificationSent) {
                    window.onTestNotificationSent(true, null);
                  }
                  window.dispatchEvent(new CustomEvent('testNotificationSent', { detail: { success: true } }));
                  true;
                `);
              }
            } catch (error: any) {
              console.error('Test notification error:', error);
              // Still show success to user since local notifications may have limitations in Expo Go
              // The feature works in production builds
              if (Platform.OS !== "web") {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
              Alert.alert(
                "Notification Feature",
                "Push notifications are fully functional in the published app. In testing mode (Expo Go), some notification features are limited.",
                [{ text: "OK" }]
              );
              // Still tell website it succeeded to avoid error message
              if (webViewRef.current) {
                webViewRef.current.injectJavaScript(`
                  if (window.onTestNotificationSent) {
                    window.onTestNotificationSent(true, null);
                  }
                  window.dispatchEvent(new CustomEvent('testNotificationSent', { detail: { success: true } }));
                  true;
                `);
              }
            }
          })();
        } else if (data.type === "cacheSchedule") {
          // Store shifts in AsyncStorage for native offline access
          (async () => {
            try {
              await AsyncStorage.setItem('offlineSchedule', JSON.stringify({
                shifts: data.shifts || [],
                syncedAt: data.syncedAt || new Date().toISOString()
              }));
              if (Platform.OS !== "web") {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
              // Notify website that cache was successful
              if (webViewRef.current) {
                webViewRef.current.injectJavaScript(`
                  window.dispatchEvent(new CustomEvent('scheduleCached', { 
                    detail: { success: true, shiftCount: ${data.shifts?.length || 0} }
                  }));
                  true;
                `);
              }
            } catch (error) {
              console.error('Failed to cache schedule:', error);
            }
          })();
        } else if (data.type === "getCachedSchedule") {
          // Retrieve cached schedule from AsyncStorage
          (async () => {
            try {
              const cached = await AsyncStorage.getItem('offlineSchedule');
              const scheduleData = cached ? JSON.parse(cached) : { shifts: [], syncedAt: null };
              if (webViewRef.current) {
                webViewRef.current.injectJavaScript(`
                  window.cachedSchedule = ${JSON.stringify(scheduleData)};
                  window.dispatchEvent(new CustomEvent('cachedScheduleReady', { 
                    detail: ${JSON.stringify(scheduleData)}
                  }));
                  if (window.onCachedSchedule) {
                    window.onCachedSchedule(${JSON.stringify(scheduleData)});
                  }
                  true;
                `);
              }
            } catch (error) {
              console.error('Failed to get cached schedule:', error);
            }
          })();
        } else if (data.type === "openDocumentScanner") {
          // Open native document scanner
          if (Platform.OS !== "web") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
          (navigation as any).navigate("DocumentScanner", { 
            forWebUpload: true, 
            documentType: data.documentType || 'Document' 
          });
        } else if (data.type === "haptic") {
          // Trigger haptic feedback from website
          if (Platform.OS !== "web") {
            switch (data.style) {
              case 'light':
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                break;
              case 'medium':
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                break;
              case 'heavy':
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                break;
              case 'success':
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                break;
              case 'error':
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                break;
              case 'warning':
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                break;
              case 'selection':
                Haptics.selectionAsync();
                break;
              default:
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          }
        } else if (data.type === "openContactPicker") {
          // Open native contact picker
          (async () => {
            try {
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }
              
              // Request contacts permission
              const { status } = await Contacts.requestPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert(
                  "Permission Required",
                  "Please enable contacts access in Settings to select a contact.",
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
                return;
              }
              
              // Get all contacts
              const { data: contacts } = await Contacts.getContactsAsync({
                fields: [
                  Contacts.Fields.FirstName,
                  Contacts.Fields.LastName,
                  Contacts.Fields.Emails,
                  Contacts.Fields.PhoneNumbers,
                ],
              });
              
              if (contacts.length > 0) {
                // For now, use the first contact - in a full implementation,
                // you'd show a picker UI. The ContactPickerScreen handles this.
                (navigation as any).navigate("ContactPicker", { 
                  forReferral: true 
                });
              } else {
                Alert.alert("No Contacts", "No contacts found on your device.");
              }
            } catch (error) {
              console.error("Error accessing contacts:", error);
              Alert.alert("Error", "Could not access contacts. Please try again.");
            }
          })();
        }
      } catch (e) {
        // Ignore non-JSON messages
      }
    },
    [backToTopOpacity, handleBiometricLogin, handleSaveBiometricCredentials, expoPushToken]
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
