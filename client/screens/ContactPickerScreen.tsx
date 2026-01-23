import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  StyleSheet,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Linking,
  Share,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Contacts from "expo-contacts";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { BrandColors, Spacing, BorderRadius } from "@/constants/theme";

interface SelectedContact {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

type ContactPickerRouteParams = {
  ContactPicker: {
    forReferral?: boolean;
  };
};

export default function ContactPickerScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<ContactPickerRouteParams, 'ContactPicker'>>();
  const forReferral = route.params?.forReferral || false;
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  const [permission, setPermission] = useState<Contacts.PermissionResponse | null>(null);
  const [selectedContacts, setSelectedContacts] = useState<SelectedContact[]>([]);
  const [hasTriggeredPicker, setHasTriggeredPicker] = useState(false);

  // Auto-trigger native contact picker when opened for referral
  useEffect(() => {
    if (forReferral && Platform.OS === "ios" && !hasTriggeredPicker) {
      setHasTriggeredPicker(true);
      
      const triggerNativePicker = async () => {
        try {
          const { status } = await Contacts.requestPermissionsAsync();
          if (status !== "granted") {
            Alert.alert(
              "Permission Required",
              "Please enable contacts access in Settings to select a contact.",
              [
                { text: "Cancel", onPress: () => navigation.goBack(), style: "cancel" },
                {
                  text: "Open Settings",
                  onPress: () => {
                    Linking.openSettings();
                    navigation.goBack();
                  },
                },
              ]
            );
            return;
          }
          
          const contact = await Contacts.presentContactPickerAsync();
          
          if (contact) {
            const contactData = {
              firstName: contact.firstName || contact.name?.split(' ')[0] || '',
              lastName: contact.lastName || contact.name?.split(' ').slice(1).join(' ') || '',
              emails: contact.emails?.map(e => ({ email: e.email })) || [],
              phoneNumbers: contact.phoneNumbers?.map(p => ({ number: p.number })) || [],
            };
            
            await AsyncStorage.setItem('selectedContact', JSON.stringify(contactData));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          
          navigation.goBack();
        } catch (error) {
          console.error("Error picking contact:", error);
          Alert.alert("Error", "Could not access contacts. Please try again.");
          navigation.goBack();
        }
      };
      
      // Small delay to let the screen finish mounting
      setTimeout(triggerNativePicker, 100);
    }
  }, [forReferral, hasTriggeredPicker, navigation]);

  const requestPermission = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const status = await Contacts.requestPermissionsAsync();
    setPermission(status);

    if (!status.granted && !status.canAskAgain) {
      Alert.alert(
        "Permission Required",
        "Please enable contacts access in Settings to refer friends.",
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

  const pickContact = useCallback(async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const { status } = await Contacts.getPermissionsAsync();
    if (status !== "granted") {
      await requestPermission();
      return;
    }

    try {
      // Use native contact picker UI on iOS
      if (Platform.OS === "ios") {
        const contact = await Contacts.presentContactPickerAsync();
        
        if (contact) {
          // If opened for web referral, save contact and navigate back
          if (forReferral) {
            const contactData = {
              firstName: contact.firstName || contact.name?.split(' ')[0] || '',
              lastName: contact.lastName || contact.name?.split(' ').slice(1).join(' ') || '',
              emails: contact.emails?.map(e => ({ email: e.email })) || [],
              phoneNumbers: contact.phoneNumbers?.map(p => ({ number: p.number })) || [],
            };
            
            await AsyncStorage.setItem('selectedContact', JSON.stringify(contactData));
            
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            
            navigation.goBack();
            return;
          }

          const newContact: SelectedContact = {
            id: contact.id || Date.now().toString(),
            name: contact.name || "Unknown",
            phone: contact.phoneNumbers?.[0]?.number,
            email: contact.emails?.[0]?.email,
          };

          const exists = selectedContacts.some((c) => c.id === newContact.id);
          if (!exists) {
            setSelectedContacts((prev) => [...prev, newContact]);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } else {
            Alert.alert("Already Added", "This contact has already been selected.");
          }
        }
        return;
      }

      // Fallback for Android - get contacts list and pick first match
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails, Contacts.Fields.FirstName, Contacts.Fields.LastName],
      });

      if (data.length === 0) {
        Alert.alert("No Contacts", "No contacts found on this device.");
        return;
      }

      // On Android, present a simple selection from first 10 contacts
      const contact = data[0];

      if (contact) {
        const newContact: SelectedContact = {
          id: contact.id || Date.now().toString(),
          name: contact.name || "Unknown",
          phone: contact.phoneNumbers?.[0]?.number,
          email: contact.emails?.[0]?.email,
        };

        // If opened for web referral, save contact and navigate back
        if (forReferral) {
          const contactData = {
            firstName: contact.firstName || contact.name?.split(' ')[0] || '',
            lastName: contact.lastName || contact.name?.split(' ').slice(1).join(' ') || '',
            emails: contact.emails?.map(e => ({ email: e.email })) || [],
            phoneNumbers: contact.phoneNumbers?.map(p => ({ number: p.number })) || [],
          };
          
          await AsyncStorage.setItem('selectedContact', JSON.stringify(contactData));
          
          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          
          navigation.goBack();
          return;
        }

        const exists = selectedContacts.some((c) => c.id === newContact.id);
        if (!exists) {
          setSelectedContacts((prev) => [...prev, newContact]);
          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        } else {
          Alert.alert("Already Added", "This contact has already been selected.");
        }
      }
    } catch (error) {
      console.error("Error picking contact:", error);
      Alert.alert("Error", "Could not access contacts. Please try again.");
    }
  }, [selectedContacts, forReferral, navigation]);

  const removeContact = useCallback((id: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedContacts((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const sendReferrals = useCallback(async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (selectedContacts.length === 0) {
      Alert.alert("No Contacts", "Please select at least one contact to refer.");
      return;
    }

    const message = `Hey! I've been using Health Staff Pros for healthcare staffing and thought you might be interested. Check it out: https://healthstaffpros.com/referral`;

    try {
      await Share.share({
        message,
        title: "Health Staff Pros Referral",
      });

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  }, [selectedContacts]);

  if (Platform.OS === "web") {
    return (
      <ThemedView style={styles.container}>
        <View
          style={[styles.content, { paddingTop: headerHeight + Spacing.xl }]}
        >
          <View style={[styles.iconCircle, { backgroundColor: "#AF52DE15" }]}>
            <Feather name="smartphone" size={48} color="#AF52DE" />
          </View>
          <ThemedText type="h3" style={styles.title}>
            Mobile Feature
          </ThemedText>
          <ThemedText
            type="body"
            style={[styles.subtitle, { color: theme.textSecondary }]}
          >
            Contact picker is available when using the app on your mobile
            device. Scan the QR code in Expo Go to access this feature.
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (!permission?.granted) {
    return (
      <ThemedView style={styles.container}>
        <View
          style={[styles.content, { paddingTop: headerHeight + Spacing.xl }]}
        >
          <View style={[styles.iconCircle, { backgroundColor: "#AF52DE15" }]}>
            <Feather name="users" size={48} color="#AF52DE" />
          </View>
          <ThemedText type="h3" style={styles.title}>
            Refer a Friend
          </ThemedText>
          <ThemedText
            type="body"
            style={[styles.subtitle, { color: theme.textSecondary }]}
          >
            Select contacts from your phone to invite them to join Health Staff
            Pros.
          </ThemedText>

          <Pressable
            onPress={requestPermission}
            style={[styles.button, { backgroundColor: BrandColors.primary }]}
            testID="enable-contacts-button"
          >
            <Feather name="users" size={20} color="#FFFFFF" />
            <ThemedText style={styles.buttonText}>Access Contacts</ThemedText>
          </Pressable>
        </View>
      </ThemedView>
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
        <View style={styles.header}>
          <ThemedText type="h4" style={styles.headerTitle}>
            Invite Friends to Health Staff Pros
          </ThemedText>
          <ThemedText
            type="body"
            style={[styles.headerSubtitle, { color: theme.textSecondary }]}
          >
            Earn rewards when your referrals join and complete their first
            shift!
          </ThemedText>
        </View>

        <Pressable
          onPress={pickContact}
          style={[styles.addButton, { backgroundColor: theme.backgroundDefault }]}
          testID="add-contact-button"
        >
          <View style={[styles.addIcon, { backgroundColor: "#AF52DE15" }]}>
            <Feather name="user-plus" size={24} color="#AF52DE" />
          </View>
          <ThemedText style={styles.addButtonText}>Add Contact</ThemedText>
          <Feather name="plus" size={20} color={theme.textSecondary} />
        </Pressable>

        {selectedContacts.length > 0 ? (
          <>
            <ThemedText
              type="small"
              style={[styles.sectionTitle, { color: theme.textSecondary }]}
            >
              SELECTED CONTACTS ({selectedContacts.length})
            </ThemedText>

            {selectedContacts.map((contact) => (
              <View
                key={contact.id}
                style={[
                  styles.contactCard,
                  { backgroundColor: theme.backgroundDefault },
                ]}
              >
                <View style={[styles.avatar, { backgroundColor: "#AF52DE15" }]}>
                  <ThemedText style={[styles.avatarText, { color: "#AF52DE" }]}>
                    {contact.name.charAt(0).toUpperCase()}
                  </ThemedText>
                </View>
                <View style={styles.contactInfo}>
                  <ThemedText style={styles.contactName}>
                    {contact.name}
                  </ThemedText>
                  {contact.phone ? (
                    <ThemedText
                      type="small"
                      style={{ color: theme.textSecondary }}
                    >
                      {contact.phone}
                    </ThemedText>
                  ) : contact.email ? (
                    <ThemedText
                      type="small"
                      style={{ color: theme.textSecondary }}
                    >
                      {contact.email}
                    </ThemedText>
                  ) : null}
                </View>
                <Pressable
                  onPress={() => removeContact(contact.id)}
                  style={styles.removeButton}
                >
                  <Feather name="x" size={18} color={theme.textTertiary} />
                </Pressable>
              </View>
            ))}

            <Pressable
              onPress={sendReferrals}
              style={[styles.sendButton, { backgroundColor: BrandColors.primary }]}
              testID="send-referrals-button"
            >
              <Feather name="send" size={20} color="#FFFFFF" />
              <ThemedText style={styles.sendButtonText}>
                Send Referral Invites
              </ThemedText>
            </Pressable>
          </>
        ) : (
          <View
            style={[
              styles.emptyState,
              { backgroundColor: theme.backgroundDefault },
            ]}
          >
            <Feather name="user-plus" size={32} color={theme.textTertiary} />
            <ThemedText
              type="body"
              style={{ color: theme.textSecondary, textAlign: "center" }}
            >
              Tap "Add Contact" to select friends you'd like to invite
            </ThemedText>
          </View>
        )}

        <View
          style={[styles.rewardCard, { backgroundColor: theme.backgroundDefault }]}
        >
          <View style={[styles.rewardIcon, { backgroundColor: "#34C75915" }]}>
            <Feather name="gift" size={24} color="#34C759" />
          </View>
          <View style={styles.rewardContent}>
            <ThemedText style={styles.rewardTitle}>Earn $50 Bonus</ThemedText>
            <ThemedText
              type="small"
              style={{ color: theme.textSecondary }}
            >
              For each friend who completes their first shift
            </ThemedText>
          </View>
        </View>
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
  header: {
    marginBottom: Spacing.xl,
  },
  headerTitle: {
    marginBottom: Spacing.sm,
  },
  headerSubtitle: {},
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  addIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonText: {
    flex: 1,
    fontWeight: "600",
  },
  sectionTitle: {
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontWeight: "700",
    fontSize: 18,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontWeight: "600",
    marginBottom: 2,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  sendButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  emptyState: {
    alignItems: "center",
    padding: Spacing["2xl"],
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  rewardCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xl,
    gap: Spacing.md,
  },
  rewardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  rewardContent: {
    flex: 1,
  },
  rewardTitle: {
    fontWeight: "600",
    marginBottom: 2,
  },
});
