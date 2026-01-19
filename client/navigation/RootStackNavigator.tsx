import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import WebViewScreen from "@/screens/WebViewScreen";
import SettingsScreen from "@/screens/SettingsScreen";
import ErrorScreen from "@/screens/ErrorScreen";
import FeaturesScreen from "@/screens/FeaturesScreen";
import BiometricAuthScreen from "@/screens/BiometricAuthScreen";
import CalendarSyncScreen from "@/screens/CalendarSyncScreen";
import DocumentScannerScreen from "@/screens/DocumentScannerScreen";
import OfflineScheduleScreen from "@/screens/OfflineScheduleScreen";
import NotificationsScreen from "@/screens/NotificationsScreen";
import ContactPickerScreen from "@/screens/ContactPickerScreen";
import ShareSheetScreen from "@/screens/ShareSheetScreen";
import { HeaderTitle } from "@/components/HeaderTitle";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type RootStackParamList = {
  WebView: undefined;
  Settings: undefined;
  Error: { url?: string };
  Features: undefined;
  BiometricAuth: undefined;
  CalendarSync: undefined;
  DocumentScanner: undefined;
  OfflineSchedule: undefined;
  Notifications: undefined;
  ContactPicker: undefined;
  ShareSheet: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions({ transparent: false });
  const transparentOptions = useScreenOptions({ transparent: true });

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="WebView"
        component={WebViewScreen}
        options={{
          ...transparentOptions,
          headerTitle: () => <HeaderTitle title="Health Staff Pros" />,
        }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: "Settings",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="Error"
        component={ErrorScreen}
        options={{
          headerShown: false,
          presentation: "fullScreenModal",
        }}
      />
      <Stack.Screen
        name="Features"
        component={FeaturesScreen}
        options={{
          ...transparentOptions,
          title: "Features",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="BiometricAuth"
        component={BiometricAuthScreen}
        options={{
          ...transparentOptions,
          title: "Biometric Login",
        }}
      />
      <Stack.Screen
        name="CalendarSync"
        component={CalendarSyncScreen}
        options={{
          ...transparentOptions,
          title: "Calendar Sync",
        }}
      />
      <Stack.Screen
        name="DocumentScanner"
        component={DocumentScannerScreen}
        options={{
          ...transparentOptions,
          title: "Document Scanner",
        }}
      />
      <Stack.Screen
        name="OfflineSchedule"
        component={OfflineScheduleScreen}
        options={{
          ...transparentOptions,
          title: "Offline Schedule",
        }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          ...transparentOptions,
          title: "Notifications",
        }}
      />
      <Stack.Screen
        name="ContactPicker"
        component={ContactPickerScreen}
        options={{
          ...transparentOptions,
          title: "Refer a Friend",
        }}
      />
      <Stack.Screen
        name="ShareSheet"
        component={ShareSheetScreen}
        options={{
          ...transparentOptions,
          title: "Share",
        }}
      />
    </Stack.Navigator>
  );
}
