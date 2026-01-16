import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import WebViewScreen from "@/screens/WebViewScreen";
import SettingsScreen from "@/screens/SettingsScreen";
import ErrorScreen from "@/screens/ErrorScreen";
import { HeaderTitle } from "@/components/HeaderTitle";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type RootStackParamList = {
  WebView: undefined;
  Settings: undefined;
  Error: { url?: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions({ transparent: false });

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="WebView"
        component={WebViewScreen}
        options={{
          headerTitle: () => <HeaderTitle title="Health Staff Pros" />,
          headerShown: false,
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
    </Stack.Navigator>
  );
}
