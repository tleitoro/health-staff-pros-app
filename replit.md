# Health Staff Pros Mobile App

## Overview
A mobile app wrapper for healthstaffpros.com that provides a native app experience while preserving the full functionality of the web application. Built with React Native (Expo) for iOS and Android.

## Current State
- **Version**: 1.0.0
- **Status**: MVP Complete
- **Last Updated**: January 2026

## Features
- WebView wrapper loading healthstaffpros.com securely
- Session/cookie persistence for login state
- Pull-to-refresh functionality
- Back/forward navigation within WebView
- Settings screen with cache and cookie management
- Error screen for network failures
- App Store compliant structure

## Project Architecture

### Frontend (React Native / Expo)
```
client/
├── App.tsx                    # Root component with providers
├── components/                # Reusable UI components
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── ErrorBoundary.tsx
│   ├── HeaderTitle.tsx
│   ├── ThemedText.tsx
│   └── ThemedView.tsx
├── constants/
│   └── theme.ts               # Colors, spacing, typography
├── hooks/
│   ├── useColorScheme.ts
│   ├── useScreenOptions.ts
│   └── useTheme.ts
├── navigation/
│   └── RootStackNavigator.tsx # Stack navigation (WebView, Settings, Error)
└── screens/
    ├── WebViewScreen.tsx      # Main WebView wrapper
    ├── SettingsScreen.tsx     # App settings
    └── ErrorScreen.tsx        # Network error handling
```

### Key Dependencies
- react-native-webview: WebView component
- expo-haptics: Haptic feedback
- expo-web-browser: External link handling
- react-native-reanimated: Animations

## Screens

### 1. WebView Screen (Main)
- Displays healthstaffpros.com in full-screen WebView
- Progress bar during page loads
- Back/forward navigation buttons in header (when applicable)
- Settings button in header
- Pull-to-refresh support
- "Back to Top" floating button on scroll

### 2. Settings Screen
- Clear Cache option
- Clear Cookies option (logs user out)
- Contact Support (email)
- Terms of Service link
- Privacy Policy link
- App version display

### 3. Error Screen
- Network error illustration
- "Try Again" button to reload
- "Check Connection" button to open device settings

## Native Features Ready for Future Enhancement
- Push notifications (not implemented)
- Camera/media access (not implemented)
- Location services (not implemented)
- Native messaging (not implemented)
- Biometric authentication (not implemented)

## Configuration

### app.json
- Bundle ID: com.healthstaffpros.app
- App Name: Health Staff Pros
- URL Scheme: healthstaffpros

### Environment
No external API keys required - the app wraps the existing web application.

## Development Commands
- `npm run expo:dev` - Start Expo dev server
- Scan QR code with Expo Go app to test on device

## App Store Compliance Notes
1. No login bypass - uses web authentication
2. Minimal permissions required
3. Privacy policy accessible in Settings
4. No third-party tracking
5. WebView content from own domain only
