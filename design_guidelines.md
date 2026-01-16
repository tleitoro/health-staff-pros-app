# Health Staff Pros Mobile App - Design Guidelines

## Brand Identity

**Purpose**: Professional healthcare staffing platform wrapper that brings the full web experience to mobile with native polish and future extensibility.

**Aesthetic Direction**: **Trusted Professional** - Clean, authoritative, and reassuring. Healthcare is serious business; the app should feel secure, stable, and built for professionals. Think subtle sophistication over flashy elements.

**Memorable Element**: Seamless transition between native shell and web content - users should feel like they're using a cohesive native app, not "just a website."

## Navigation Architecture

**Root Navigation**: Stack-Only (WebView-focused)

**Screen List**:
1. **Splash Screen** - Brand presentation during initial load
2. **WebView Screen** - Main screen showing healthstaffpros.com
3. **Error Screen** - Network/loading failure state
4. **Settings Screen** - App preferences (accessed via header button)

## Screen-by-Scene Specifications

### 1. Splash Screen
**Purpose**: Brand presentation while app initializes and web content loads

**Layout**:
- Full-screen centered logo/brand asset
- No header
- Background: Brand primary color or white
- Loading indicator below logo

**Safe Area**: Full bleed

**Components**:
- App logo (large, centered)
- Subtle loading spinner
- Optional tagline beneath logo

---

### 2. WebView Screen
**Purpose**: Display healthstaffpros.com with native chrome

**Layout**:
- **Header**: Minimal custom header (non-transparent)
  - Left: Back button (only when web navigation stack exists)
  - Right: Settings icon button
  - Title: Current page title from web (or "Health Staff Pros")
  - Include pull-to-refresh capability
- **Main Content**: Full WebView
  - Occupies all space below header
  - Zoom disabled
  - Scroll bounce enabled
- **No tab bar or footer**

**Safe Area**:
- Top: Handled by custom header
- Bottom: insets.bottom (respect home indicator)
- WebView should extend edge-to-edge below header

**Components**:
- WebView with progress indicator during page loads
- Floating "Back to Top" button (appears on scroll, bottom-right)
- Cookie/session management (preserve login)

---

### 3. Error Screen
**Purpose**: Handle network failures or load errors gracefully

**Layout**:
- **Header**: Standard header with Settings button
- **Main Content**: Centered error state
  - Error illustration
  - Error message
  - "Retry" button

**Safe Area**:
- Top: headerHeight + Spacing.xl
- Bottom: insets.bottom + Spacing.xl

**Components**:
- Error illustration (custom asset)
- Error title (large, semibold)
- Error description (body text)
- Primary action button ("Try Again")
- Secondary text link ("Check Connection")

---

### 4. Settings Screen
**Purpose**: App preferences and information

**Layout**:
- **Header**: Standard with "Settings" title, left close/back button
- **Main Content**: Scrollable settings list
  
**Safe Area**:
- Top: Spacing.xl (below header)
- Bottom: insets.bottom + Spacing.xl

**Components** (Settings List):
- Clear Cache
- Clear Cookies
- About section (App version, Terms, Privacy Policy)
- Contact Support (opens email or web form)

---

## Color Palette

**Brand Colors**:
- Primary: `#0066CC` (Professional blue - trust, healthcare)
- Primary Dark: `#004C99` (Pressed states)

**Neutrals**:
- Background: `#FFFFFF`
- Surface: `#F8F9FA`
- Border: `#E1E4E8`

**Text**:
- Primary: `#1A1A1A`
- Secondary: `#6B7280`
- Tertiary: `#9CA3AF`

**Semantic**:
- Error: `#DC2626`
- Success: `#059669`

**Visual Feedback**:
- Touchables: 30% opacity overlay on press
- Header buttons: Subtle scale (0.95) on press

---

## Typography

**Font**: System default (SF Pro for iOS, Roboto for Android) - professional, legible, platform-appropriate

**Type Scale**:
- Display: 28pt, Bold (Splash screen, major titles)
- Title: 20pt, Semibold (Screen headers)
- Body: 16pt, Regular (Primary content)
- Caption: 14pt, Regular (Secondary text)
- Small: 12pt, Regular (Tertiary info)

---

## Assets to Generate

1. **icon.png** - App icon
   - Description: Healthcare cross or "HSP" monogram in brand blue, clean geometric design
   - WHERE USED: Device home screen, App Store

2. **splash-icon.png** - Splash screen logo
   - Description: Full "Health Staff Pros" wordmark or logo with tagline
   - WHERE USED: Splash screen during app launch

3. **error-network.png** - Network error illustration
   - Description: Simple illustration of disconnected wifi or broken connection (minimal, single-color)
   - WHERE USED: Error screen when network fails

4. **error-load.png** - Load error illustration
   - Description: Simple illustration of document with exclamation mark
   - WHERE USED: Error screen when page fails to load

**Asset Style**: Minimal line art or geometric shapes in brand primary color, avoid complex details. Professional and clean, not playful.

---

## Implementation Notes

- **Session Persistence**: Use cookies and local storage. Inject JavaScript to detect login state if needed.
- **Native Feature Readiness**: Structure code with navigation container ready to add native screens alongside WebView (e.g., future native messaging, profile screens).
- **Security**: Use HTTPS only, implement certificate pinning if handling sensitive data.
- **Performance**: Show progress bar during loads; cache aggressively.
- **Platform Compliance**: Request minimal permissions; include privacy policy link in Settings.