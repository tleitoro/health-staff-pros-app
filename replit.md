# Health Staff Pros Mobile App

## Overview
A mobile app wrapper for healthstaffpros.com that provides a native app experience while preserving the full functionality of the web application. Built with React Native (Expo) for iOS and Android.

## Current State
- **Version**: 1.0.0
- **Status**: MVP Complete with Native Features
- **Last Updated**: January 2026

## Features

### Core WebView Features
- WebView wrapper loading healthstaffpros.com securely
- Session/cookie persistence for login state
- Pull-to-refresh functionality
- Back/forward navigation within WebView
- Settings screen with cache and cookie management
- Error screen for network failures
- File upload support for profile pictures and documents
- "Back to Top" floating button on scroll

### Native Features (Apple Guideline 4.2 Compliance)
1. **Biometric Login** - Face ID/Touch ID authentication with secure credential storage
2. **Calendar Sync** - Add work shifts directly to device calendar
3. **Document Scanner** - Camera-based scanning for licenses and certifications
4. **Offline Schedule** - Access cached schedule data without network connection
5. **Push Notifications** - Granular notification preferences for shifts, messages, etc.
6. **Contact Referrals** - Native contact picker for referring colleagues
7. **Haptic Feedback** - Integrated throughout app for native feel
8. **Native Share Sheet** - Share jobs and referrals using native sharing

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
│   └── RootStackNavigator.tsx # Stack navigation
└── screens/
    ├── WebViewScreen.tsx      # Main WebView wrapper
    ├── SettingsScreen.tsx     # App settings
    ├── ErrorScreen.tsx        # Network error handling
    ├── FeaturesScreen.tsx     # Native features hub
    ├── BiometricAuthScreen.tsx
    ├── CalendarSyncScreen.tsx
    ├── DocumentScannerScreen.tsx
    ├── OfflineScheduleScreen.tsx
    ├── NotificationsScreen.tsx
    ├── ContactPickerScreen.tsx
    └── ShareSheetScreen.tsx
```

### Key Dependencies
- react-native-webview: WebView component
- expo-haptics: Haptic feedback
- expo-web-browser: External link handling
- react-native-reanimated: Animations
- expo-local-authentication: Biometric login
- expo-calendar: Calendar integration
- expo-camera: Document scanning
- expo-contacts: Contact picker
- expo-notifications: Push notifications
- expo-image-picker: Photo selection

## Screens

### 1. WebView Screen (Main)
- Displays healthstaffpros.com in full-screen WebView
- Transparent header with navigation buttons
- Progress bar during page loads
- Back/forward navigation buttons in header (when applicable)
- Features button (grid icon) and Settings button (cog icon) in header
- Pull-to-refresh support
- "Back to Top" floating button on scroll
- File upload support for profile pictures

### 2. Settings Screen (Modal)
- App Features link to native features hub
- Clear Cache option
- Clear Cookies option (logs user out)
- Contact Support (email)
- Terms of Service link
- Privacy Policy link
- App version display

### 3. Features Screen (Modal)
- Hub for all native features
- Card-based navigation to individual feature screens
- Shows 6 main feature categories

### 4. Native Feature Screens
Each feature screen detects platform and shows:
- Full functionality on iOS/Android
- Helpful fallback message on web directing to Expo Go

### 5. Error Screen
- Network error illustration
- "Try Again" button to reload
- "Check Connection" button to open device settings

## Configuration

### app.json
- Bundle ID: com.healthstaffpros.app
- App Name: Health Staff Pros
- URL Scheme: healthstaffpros

### Environment
No external API keys required - the app wraps the existing web application.

## Development Commands
- `npm run expo:dev` - Start Expo dev server
- `npm run server:dev` - Start Express backend
- Scan QR code with Expo Go app to test on device

## WebView Integration
The app can be detected by healthstaffpros.com via:
- `window.isHealthStaffProsApp` - Boolean flag
- `window.HealthStaffProsApp` - Object with version and platform info
- `window.ReactNativeWebView` - WebView message handler
- User-Agent contains "HealthStaffProsApp/1.0"

## App Store Compliance Notes
1. No login bypass - uses web authentication
2. Minimal permissions required (camera, contacts, calendar, notifications)
3. Privacy policy accessible in Settings
4. No third-party tracking
5. WebView content from own domain only
6. 8 native features demonstrate app value beyond simple web wrapper (Guideline 4.2)
7. All buttons and interactive elements are responsive (Guideline 2.1)

## Recent Bug Fixes (January 2026)
- Fixed Settings button not working (header configuration issue)
- Added file upload support for profile picture changes
- Enabled header on WebView screen for proper navigation
- Added Features/Settings buttons to web fallback screen
