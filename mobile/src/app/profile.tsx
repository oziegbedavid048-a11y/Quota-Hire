/**
 * Quota Hire — User Profile Screen (Mobile)
 * EXACT visual clone of src/pages/employee/Profile.tsx
 *
 * All edit actions are 100% native in-app modals:
 * - Contact & Location editor
 * - Native PDF Resume file upload (using expo-document-picker)
 * - Bio summary editor
 * - Core Skills list editor
 * - Experience & Education editors
 * - Password change editor
 * - Tailored CVs viewer & Download Payment drawer integration
 */

import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  TextInput,
  ActivityIndicator,
  Modal,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Animated as RNAnimated,
} from "react-native";
import { useRouter } from "expo-router";

const { height: SCREEN_H } = Dimensions.get("window");
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import * as SecureStore from "expo-secure-store";

import {
  Colors,
  Palette,
  Shadow,
  BorderRadius,
  FontSize,
  FontWeight,
  TabBarHeight,
} from "@/constants/theme";
import { useLocalDashboardData } from "@/hooks/useLocalDashboardData";
import { apiFetch, API_BASE } from "@/services/api";
import NativePaymentModal from "@/components/native-payment-modal";
import CompanyProfile from "@/components/company-profile";

function Skeleton({
  width,
  height,
  borderRadius,
  style,
}: {
  width?: any;
  height?: any;
  borderRadius?: number;
  style?: any;
}) {
  const opacity = useRef(new RNAnimated.Value(0.3)).current;

  useEffect(() => {
    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(opacity, {
          toValue: 0.8,
          duration: 850,
          useNativeDriver: true,
        }),
        RNAnimated.timing(opacity, {
          toValue: 0.3,
          duration: 850,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [opacity]);

  return (
    <RNAnimated.View
      style={[
        {
          width: width ?? "100%",
          height: height ?? 20,
          backgroundColor: "#e2e8f0",
          borderRadius: borderRadius ?? 8,
          opacity: opacity,
        },
        style,
      ]}
    />
  );
}

const PROFILE_SECTIONS = [
  {
    key: "contact",
    label: "Contact & Location",
    icon: "user",
    iconBg: Palette.indigo50,
    iconColor: Palette.indigo500,
  },
  {
    key: "resume",
    label: "Resume / CV",
    icon: "file-text",
    iconBg: Palette.warm50,
    iconColor: Palette.warm500,
  },
  {
    key: "bio",
    label: "About You (Bio)",
    icon: "message-square",
    iconBg: Palette.accent50,
    iconColor: Palette.accent600,
  },
  {
    key: "qualifications",
    label: "Skills & Expertise",
    icon: "award",
    iconBg: Palette.emerald50,
    iconColor: Palette.emerald500,
  },
  {
    key: "experience",
    label: "Work Experience",
    icon: "briefcase",
    iconBg: Palette.violet50,
    iconColor: Palette.violet500,
  },
  {
    key: "education",
    label: "Education",
    icon: "book-open",
    iconBg: Palette.blue50,
    iconColor: Palette.blue500,
  },
  {
    key: "generated-cvs",
    label: "My Tailored CVs",
    icon: "folder",
    iconBg: Palette.accent50,
    iconColor: Palette.accent500,
  },
  {
    key: "password",
    label: "Change Password",
    icon: "lock",
    iconBg: Palette.red50,
    iconColor: Palette.red500,
  },
] as const;

type SectionKey = (typeof PROFILE_SECTIONS)[number]["key"];

export default function ProfileScreen() {
  const colors = Colors.light;

  const [role, setRole] = useState<string | null>(null);
  useEffect(() => {
    SecureStore.getItemAsync("user_role").then((r) => setRole(r || "employee"));
  }, []);

  const { user, profileScore, profileItems, refreshData, isFetching } =
    useLocalDashboardData();
  const firstName = user.name.split(" ")[0];
  const initial = user.name.charAt(0).toUpperCase();

  // Active section editor modal
  const [activeSection, setActiveSection] = useState<SectionKey | null>(null);
  const [saving, setSaving] = useState(false);

  // General Form States
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState("");
  const [expYears, setExpYears] = useState("");
  const [education, setEducation] = useState("");

  // Password State
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Tailored CVs list
  const [generatedCVs, setGeneratedCVs] = useState<any[]>([]);
  const [cvsLoading, setCvsLoading] = useState(false);
  const [paymentVisible, setPaymentVisible] = useState(false);
  const [selectedCV, setSelectedCV] = useState<any | null>(null);

  // Resume parsing flow state
  const [parsedResume, setParsedResume] = useState<any | null>(null);
  const [resumeParsing, setResumeParsing] = useState(false);

  // Load tailored CVs count on mount
  useEffect(() => {
    fetchCVs();
  }, []);

  // Profile Picture Upload Handler — uses expo-image-picker for proper gallery access
  const handleAvatarUpload = async () => {
    // Request permission to access the photo library
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please allow access to your photo library in Settings to upload a profile picture.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]) return;

    setSaving(true);
    const asset = result.assets[0];

    const fileName = asset.uri.split("/").pop() || "avatar.jpg";
    const ext = fileName.split(".").pop()?.toLowerCase() || "jpg";
    const mimeType =
      ext === "png"
        ? "image/png"
        : ext === "webp"
          ? "image/webp"
          : "image/jpeg";

    const formData = new FormData();
    formData.append("avatar", {
      uri: asset.uri,
      name: fileName,
      type: mimeType,
    } as any);

    try {
      const token = await SecureStore.getItemAsync("access_token");
      const resp = await fetch(`${API_BASE}/profile/avatar/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body.error || "Upload failed");
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Profile picture updated!");
      refreshData();
    } catch (err: any) {
      Alert.alert(
        "Upload Failed",
        err.message || "Unable to upload profile picture. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  type SectionGroupItem = {
    key: SectionKey;
    icon:
      | "user"
      | "file-text"
      | "message-square"
      | "award"
      | "briefcase"
      | "book-open"
      | "folder"
      | "lock";
    label: string;
    subtitle: string;
    iconBg: string;
    iconColor: string;
    filled: boolean;
    actionText?: string;
    actionColor?: string;
    actionTextColor?: string;
  };

  const profileSectionGroups: { group: string; items: SectionGroupItem[] }[] = [
    {
      group: "Account Info",
      items: [
        {
          key: "contact" as SectionKey,
          icon: "user" as const,
          label: "Personal Details",
          subtitle: user.location || "Name, phone, and location.",
          iconBg: Palette.indigo50,
          iconColor: Palette.indigo500,
          filled: !!(user.location || user.phone),
        },
      ],
    },
    {
      group: "Resume",
      items: [
        {
          key: "resume" as SectionKey,
          icon: "file-text" as const,
          label: "Smart Resume Upload",
          subtitle: user.resumeUrl
            ? "Resume uploaded"
            : "Upload CV to automatically fill your profile.",
          iconBg: Palette.warm50,
          iconColor: Palette.warm500,
          filled: !!user.resumeUrl,
          actionText: user.resumeUrl ? "Update" : "Add",
          actionColor: user.resumeUrl
            ? "rgba(16,185,129,0.1)"
            : "rgba(245,158,11,0.1)",
          actionTextColor: user.resumeUrl
            ? Palette.emerald600
            : Palette.warm500,
        },
      ],
    },
    {
      group: "Improve your job matches",
      items: [
        {
          key: "bio" as SectionKey,
          icon: "message-square" as const,
          label: "About You (Bio)",
          subtitle: user.bio ? "Bio added" : "Tell employers about yourself.",
          iconBg: Palette.accent50,
          iconColor: Palette.accent600,
          filled: !!user.bio,
        },
        {
          key: "qualifications" as SectionKey,
          icon: "award" as const,
          label: "Skills & Expertise",
          subtitle:
            user.skills && user.skills.length > 0
              ? `${user.skills.length} skill${user.skills.length > 1 ? "s" : ""} added`
              : "Highlight your skills and expertise.",
          iconBg: Palette.emerald50,
          iconColor: Palette.emerald500,
          filled: !!(user.skills && user.skills.length > 0),
        },
        {
          key: "experience" as SectionKey,
          icon: "briefcase" as const,
          label: "Work Experience",
          subtitle: user.title
            ? `${user.title} (${user.experienceYears || 0} yrs)`
            : "Add your work experience and title.",
          iconBg: Palette.violet50,
          iconColor: Palette.violet500,
          filled: !!user.title,
        },
        {
          key: "education" as SectionKey,
          icon: "book-open" as const,
          label: "Education",
          subtitle: user.education
            ? user.education.length > 55
              ? user.education.substring(0, 52) + "..."
              : user.education
            : "Add your education background.",
          iconBg: Palette.blue50,
          iconColor: Palette.blue500,
          filled: !!user.education,
        },
      ],
    },
    {
      group: "Generated Documents",
      items: [
        {
          key: "generated-cvs" as SectionKey,
          icon: "folder" as const,
          label: "My Tailored CVs",
          subtitle:
            generatedCVs.length > 0
              ? `${generatedCVs.length} generated CVs`
              : "No tailored CVs generated yet.",
          iconBg: Palette.accent50,
          iconColor: Palette.accent500,
          filled: generatedCVs.length > 0,
          actionText: "View",
          actionColor: "rgba(16,185,129,0.1)",
          actionTextColor: Palette.emerald600,
        },
      ],
    },
    {
      group: "Security",
      items: [
        {
          key: "password" as SectionKey,
          icon: "lock" as const,
          label: "Change Password",
          subtitle: "Update your account password.",
          iconBg: Palette.red50,
          iconColor: Palette.red500,
          filled: true,
        },
      ],
    },
  ];

  // Initialize form fields on opening section
  useEffect(() => {
    if (activeSection === "contact") {
      setFullName(user.name);
      setPhone(user.phone || "");
      setCity(user.location?.split(",")[0]?.trim() || "");
      setCountry(user.location?.split(",")[1]?.trim() || "");
    } else if (activeSection === "bio") {
      setBio(user.bio || "");
    } else if (activeSection === "qualifications") {
      setSkills(user.skills ? user.skills.join(", ") : "");
    } else if (activeSection === "education") {
      setEducation(user.education || "");
    } else if (activeSection === "experience") {
      setExpYears("");
    } else if (activeSection === "generated-cvs") {
      fetchCVs();
    }
    // Reset resume parsing state when modal closes or switches section
    if (activeSection !== "resume") {
      setParsedResume(null);
      setResumeParsing(false);
    }
  }, [activeSection, user]);

  const fetchCVs = async () => {
    setCvsLoading(true);
    try {
      const res = await apiFetch("/cv/my-cvs/");
      setGeneratedCVs(Array.isArray(res) ? res : res?.results || []);
    } catch (_e) {
      // silently ignore CV fetch errors
    } finally {
      setCvsLoading(false);
    }
  };

  const handleSaveContact = async () => {
    setSaving(true);
    try {
      await apiFetch("/auth/me/", {
        method: "PUT",
        body: JSON.stringify({ name: fullName }),
      });
      await apiFetch("/profile/employee/", {
        method: "PUT",
        body: JSON.stringify({
          phone_number: phone,
          city,
          country,
        }),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      refreshData();
      setActiveSection(null);
    } catch {
      Alert.alert("Error", "Failed to update contact details.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBio = async () => {
    setSaving(true);
    try {
      await apiFetch("/profile/employee/", {
        method: "PUT",
        body: JSON.stringify({ bio }),
      });
      refreshData();
      setActiveSection(null);
    } catch {
      Alert.alert("Error", "Failed to update bio summary.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSkills = async () => {
    setSaving(true);
    try {
      const skillsArray = skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      await apiFetch("/profile/employee/", {
        method: "PUT",
        body: JSON.stringify({ skills: skillsArray }),
      });
      refreshData();
      setActiveSection(null);
    } catch {
      Alert.alert("Error", "Failed to update skills.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveExp = async () => {
    setSaving(true);
    try {
      await apiFetch("/profile/employee/", {
        method: "PUT",
        body: JSON.stringify({ experience_years: parseInt(expYears) || 0 }),
      });
      refreshData();
      setActiveSection(null);
    } catch {
      Alert.alert("Error", "Failed to update work experience.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdu = async () => {
    setSaving(true);
    try {
      await apiFetch("/profile/employee/", {
        method: "PUT",
        body: JSON.stringify({ education }),
      });
      refreshData();
      setActiveSection(null);
    } catch {
      Alert.alert("Error", "Failed to update education.");
    } finally {
      setSaving(false);
    }
  };

  // Save parsed resume data into the user's profile
  const handleSaveParsedResume = async () => {
    if (!parsedResume) return;
    setSaving(true);
    try {
      const profilePayload: Record<string, any> = {};
      if (parsedResume.title) profilePayload.title = parsedResume.title;
      if (parsedResume.bio) profilePayload.bio = parsedResume.bio;
      if (parsedResume.skills?.length)
        profilePayload.skills = parsedResume.skills;
      if (parsedResume.education)
        profilePayload.education = parsedResume.education;
      if (parsedResume.experience_years)
        profilePayload.experience_years = parsedResume.experience_years;
      if (parsedResume.phone_number)
        profilePayload.phone_number = parsedResume.phone_number;
      if (parsedResume.city) profilePayload.city = parsedResume.city;
      if (parsedResume.country) profilePayload.country = parsedResume.country;

      if (Object.keys(profilePayload).length > 0) {
        await apiFetch("/profile/employee/", {
          method: "PUT",
          body: JSON.stringify(profilePayload),
        });
      }

      // Also update the top-level user location field if present
      if (parsedResume.location) {
        await apiFetch("/auth/me/", {
          method: "PUT",
          body: JSON.stringify({ location: parsedResume.location }),
        });
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Profile Updated!",
        "Your profile has been filled from your resume.",
      );
      setParsedResume(null);
      refreshData();
      setActiveSection(null);
    } catch {
      Alert.alert(
        "Error",
        "Failed to save resume data to profile. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSavePassword = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match.");
      return;
    }
    setSaving(true);
    try {
      await apiFetch("/auth/change-password/", {
        method: "POST",
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: newPassword,
        }),
      });
      Alert.alert("Success", "Password changed successfully.");
      setActiveSection(null);
    } catch {
      Alert.alert(
        "Error",
        "Could not change password. Please verify old password.",
      );
    } finally {
      setSaving(false);
    }
  };

  // Smart Resume Upload — uploads file, parses it, then shows extracted data for review
  const handleResumeUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];

      // Validate file size (5 MB max)
      if (asset.size && asset.size > 5 * 1024 * 1024) {
        Alert.alert(
          "File Too Large",
          "Please upload a file smaller than 5 MB.",
        );
        return;
      }

      setResumeParsing(true);
      setParsedResume(null);

      // IMPORTANT: field name must be "resume" — this is what the backend expects
      const formData = new FormData();
      formData.append("resume", {
        uri: asset.uri,
        name: asset.name || "resume.pdf",
        type: asset.mimeType || "application/pdf",
      } as any);

      const token = await SecureStore.getItemAsync("access_token");
      const resp = await fetch(`${API_BASE}/profile/resume/upload/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body.error || "Upload failed");
      }

      const data = await resp.json();

      if (data.parsed) {
        setParsedResume(data.parsed);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        // File saved but nothing parseable — still a partial success
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          "Resume Saved",
          "Your resume was uploaded but we could not extract profile data from it. Please fill your profile manually.",
        );
        refreshData();
        setActiveSection(null);
      }
    } catch (err: any) {
      Alert.alert(
        "Upload Failed",
        err.message || "Unable to upload resume. Please try again.",
      );
    } finally {
      setResumeParsing(false);
    }
  };

  const handleSignOut = useCallback(() => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          if (typeof (globalThis as any).logout === "function") {
            await (globalThis as any).logout();
          }
        },
      },
    ]);
  }, []);

  if (role === "company") {
    return <CompanyProfile />;
  }

  if (isFetching) {
    return (
      <View style={s.safe}>
        <ScrollView
          contentContainerStyle={[
            s.scroll,
            { paddingBottom: TabBarHeight + 32 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Card Skeleton */}
          <View
            style={[
              s.heroCard,
              {
                borderColor: colors.border,
                alignItems: "center",
                gap: 10,
                padding: 20,
              },
            ]}
          >
            <Skeleton width={82} height={82} borderRadius={41} />
            <Skeleton
              width={180}
              height={20}
              borderRadius={6}
              style={{ marginTop: 8 }}
            />
            <Skeleton width={120} height={14} borderRadius={6} />
            <View
              style={{
                width: "100%",
                height: 8,
                backgroundColor: "#e2e8f0",
                borderRadius: 4,
                marginTop: 12,
              }}
            />
          </View>

          {/* List Item Skeletons */}
          <View
            style={[
              s.sectionsCard,
              { backgroundColor: "#ffffff", borderColor: colors.border },
            ]}
          >
            {Array.from({ length: 6 }).map((_, idx) => (
              <View
                key={idx}
                style={[
                  s.sectionRow,
                  {
                    borderColor: colors.border,
                    borderBottomWidth: idx < 5 ? 1 : 0,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  },
                ]}
              >
                <Skeleton width={38} height={38} borderRadius={10} />
                <View style={{ flex: 1, gap: 6 }}>
                  <Skeleton width="60%" height={14} borderRadius={4} />
                  <Skeleton width="40%" height={10} borderRadius={4} />
                </View>
                <Skeleton width={14} height={14} borderRadius={7} />
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={s.safe}>
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: TabBarHeight + 32 }]}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
      >
        {/* ── PROFILE HERO CARD ── */}
        <Animated.View
          entering={FadeInDown.delay(0).springify()}
          style={{ marginBottom: 20 }}
        >
          <LinearGradient
            colors={[
              "rgba(21,117,10,0.08)",
              "rgba(255,255,255,1)",
              "rgba(245,158,11,0.06)",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[s.heroCard, { borderColor: colors.border }]}
          >
            {/* Avatar */}
            <View style={s.avatarWrap}>
              <LinearGradient
                colors={[Palette.accent500, Palette.warm500]}
                style={s.avatarRing}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {user.avatarUrl ? (
                  <Image
                    source={{ uri: user.avatarUrl }}
                    style={s.avatarImg}
                    contentFit="cover"
                  />
                ) : (
                  <View
                    style={[
                      s.avatarFallback,
                      { backgroundColor: Palette.accent100 },
                    ]}
                  >
                    <Text
                      style={[s.avatarInitial, { color: Palette.accent700 }]}
                    >
                      {initial}
                    </Text>
                  </View>
                )}
              </LinearGradient>
              <Pressable
                disabled={saving}
                onPress={handleAvatarUpload}
                style={({ pressed }) => [
                  s.avatarEditBtn,
                  pressed && { opacity: 0.8 },
                ]}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Feather name="camera" size={12} color="#fff" />
                )}
              </Pressable>
            </View>

            {/* Name + title */}
            <Text style={[s.heroName, { color: colors.text }]}>
              {user.name}
            </Text>
            <View style={s.titleRow}>
              {user.title && (
                <Text style={[s.heroTitle, { color: colors.textSecondary }]}>
                  {user.title}
                </Text>
              )}
              {user.isVerified && (
                <View style={s.verifiedBadge}>
                  <Feather
                    name="check-circle"
                    size={12}
                    color={Palette.blue500}
                  />
                  <Text style={s.verifiedText}>Verified</Text>
                </View>
              )}
            </View>

            {/* Profile score */}
            <View style={s.scoreRow}>
              <Text style={[s.scoreLabel, { color: colors.textMuted }]}>
                Profile Score
              </Text>
              <Text style={[s.scoreVal, { color: Palette.accent500 }]}>
                {profileScore}%
              </Text>
            </View>
            <View style={[s.progressBg, { backgroundColor: colors.border }]}>
              <LinearGradient
                colors={[Palette.accent500, Palette.warm500]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[s.progressFill, { width: `${profileScore}%` }]}
              />
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ── PROFILE SECTIONS ── */}
        {profileSectionGroups.map((group, gi) => (
          <Animated.View
            key={group.group}
            entering={FadeInDown.delay(120 + gi * 60).springify()}
            style={{ marginBottom: 20 }}
          >
            <Text style={[s.groupHeader, { color: colors.textSecondary }]}>
              {group.group}
            </Text>

            <View
              style={[
                s.sectionsCard,
                { backgroundColor: colors.cardBg, borderColor: colors.border },
                Shadow.card,
              ]}
            >
              {group.items.map((item, i) => (
                <React.Fragment key={item.key}>
                  <Pressable
                    onPress={() => setActiveSection(item.key)}
                    style={({ pressed }) => [
                      s.sectionRow,
                      { opacity: pressed ? 0.75 : 1 },
                    ]}
                  >
                    <View
                      style={[
                        s.sectionIconWrap,
                        {
                          backgroundColor: item.filled
                            ? "rgba(99,102,241,0.1)"
                            : item.iconBg,
                        },
                      ]}
                    >
                      <Feather
                        name={item.icon as any}
                        size={16}
                        color={item.filled ? Palette.indigo500 : item.iconColor}
                      />
                    </View>

                    <View style={s.sectionTextWrap}>
                      <Text style={[s.sectionLabel, { color: colors.text }]}>
                        {item.label}
                      </Text>
                      <Text
                        style={[s.sectionSub, { color: colors.textMuted }]}
                        numberOfLines={1}
                      >
                        {item.subtitle}
                      </Text>
                    </View>

                    {item.actionText ? (
                      <View
                        style={[
                          s.actionChip,
                          { backgroundColor: item.actionColor },
                        ]}
                      >
                        <Text
                          style={[
                            s.actionChipText,
                            { color: item.actionTextColor },
                          ]}
                        >
                          {item.actionText}
                        </Text>
                      </View>
                    ) : !item.filled ? (
                      <View
                        style={[
                          s.actionChip,
                          { backgroundColor: "rgba(245,158,11,0.1)" },
                        ]}
                      >
                        <Text
                          style={[s.actionChipText, { color: Palette.warm500 }]}
                        >
                          Add
                        </Text>
                      </View>
                    ) : null}

                    <Feather
                      name="chevron-right"
                      size={14}
                      color={colors.textMuted}
                    />
                  </Pressable>
                  {i < group.items.length - 1 && (
                    <View
                      style={[s.divider, { backgroundColor: colors.border }]}
                    />
                  )}
                </React.Fragment>
              ))}
            </View>
          </Animated.View>
        ))}

        {/* ── SIGN OUT ── */}
        <Animated.View
          entering={FadeInDown.delay(240).springify()}
          style={{ marginTop: 16 }}
        >
          <Pressable
            onPress={handleSignOut}
            style={({ pressed }) => [
              s.signOutBtn,
              { backgroundColor: Palette.red50, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Feather name="log-out" size={18} color={Palette.red500} />
            <Text style={[s.signOutText, { color: Palette.red500 }]}>
              Sign Out
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>

      {/* ── NATIVE EDITORS MODAL ── */}
      <Modal
        visible={activeSection !== null && activeSection !== "generated-cvs"}
        animationType="slide"
        transparent
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={s.overlay}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => setActiveSection(null)}
            />
            <View style={[s.sheet, { backgroundColor: colors.cardBg }]}>
              <View
                style={[s.modalHeader, { borderBottomColor: colors.border }]}
              >
                <Text style={[s.modalTitle, { color: colors.text }]}>
                  {PROFILE_SECTIONS.find((s) => s.key === activeSection)?.label}
                </Text>
                <Pressable onPress={() => setActiveSection(null)}>
                  <Feather name="x" size={20} color={colors.textMuted} />
                </Pressable>
              </View>

              <ScrollView
                style={s.modalBody}
                showsVerticalScrollIndicator={false}
              >
                {activeSection === "contact" && (
                  <View style={{ gap: 14 }}>
                    <View style={s.field}>
                      <Text style={s.label}>Full Name</Text>
                      <TextInput
                        value={fullName}
                        onChangeText={setFullName}
                        style={[s.input, { borderColor: colors.border }]}
                      />
                    </View>
                    <View style={s.field}>
                      <Text style={s.label}>Phone Number</Text>
                      <TextInput
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                        style={[s.input, { borderColor: colors.border }]}
                      />
                    </View>
                    <View style={s.field}>
                      <Text style={s.label}>City</Text>
                      <TextInput
                        value={city}
                        onChangeText={setCity}
                        style={[s.input, { borderColor: colors.border }]}
                      />
                    </View>
                    <View style={s.field}>
                      <Text style={s.label}>Country</Text>
                      <TextInput
                        value={country}
                        onChangeText={setCountry}
                        style={[s.input, { borderColor: colors.border }]}
                      />
                    </View>
                    <Pressable
                      disabled={saving}
                      onPress={handleSaveContact}
                      style={[
                        s.saveBtn,
                        { backgroundColor: Palette.accent600 },
                      ]}
                    >
                      {saving ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={s.saveBtnText}>Save</Text>
                      )}
                    </Pressable>
                  </View>
                )}

                {activeSection === "resume" && (
                  <View style={{ gap: 16 }}>
                    {resumeParsing ? (
                      /* ── Step 2: Parsing loader ── */
                      <View
                        style={{
                          alignItems: "center",
                          paddingVertical: 40,
                          gap: 16,
                        }}
                      >
                        <ActivityIndicator
                          size="large"
                          color={Palette.accent500}
                        />
                        <Text
                          style={{
                            textAlign: "center",
                            fontSize: 15,
                            fontWeight: "700",
                            color: colors.text,
                          }}
                        >
                          Reading your CV…
                        </Text>
                        <Text
                          style={{
                            textAlign: "center",
                            fontSize: 13,
                            color: colors.textMuted,
                          }}
                        >
                          Extracting your profile details, please wait.
                        </Text>
                      </View>
                    ) : parsedResume ? (
                      /* ── Step 3: Parsed results ── */
                      <View style={{ gap: 14 }}>
                        {/* Success banner */}
                        <View
                          style={{
                            flexDirection: "row",
                            gap: 10,
                            padding: 14,
                            backgroundColor: "rgba(16,185,129,0.08)",
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: "rgba(16,185,129,0.2)",
                            alignItems: "flex-start",
                          }}
                        >
                          <Feather
                            name="check-circle"
                            size={16}
                            color={Palette.emerald600}
                            style={{ marginTop: 1 }}
                          />
                          <Text
                            style={{
                              flex: 1,
                              fontSize: 13,
                              color: Palette.emerald600,
                              lineHeight: 18,
                            }}
                          >
                            Extraction complete! Review the details below, then
                            tap "Save to Profile".
                          </Text>
                        </View>

                        {/* Parsed fields */}
                        {[
                          { label: "Job Title", value: parsedResume.title },
                          { label: "Summary", value: parsedResume.bio },
                          { label: "Phone", value: parsedResume.phone_number },
                          { label: "Location", value: parsedResume.location },
                          {
                            label: "Experience",
                            value: parsedResume.experience_years
                              ? `${parsedResume.experience_years} year(s)`
                              : null,
                          },
                          { label: "Education", value: parsedResume.education },
                        ]
                          .filter((f) => f.value)
                          .map((f) => (
                            <View
                              key={f.label}
                              style={{
                                gap: 3,
                                paddingBottom: 10,
                                borderBottomWidth: 1,
                                borderBottomColor: colors.border,
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 11,
                                  fontWeight: "700",
                                  textTransform: "uppercase",
                                  letterSpacing: 0.5,
                                  color: colors.textMuted,
                                }}
                              >
                                {f.label}
                              </Text>
                              <Text
                                style={{
                                  fontSize: 14,
                                  color: colors.text,
                                  lineHeight: 20,
                                }}
                              >
                                {f.value}
                              </Text>
                            </View>
                          ))}

                        {/* Skills chips */}
                        {parsedResume.skills?.length > 0 && (
                          <View style={{ gap: 8 }}>
                            <Text
                              style={{
                                fontSize: 11,
                                fontWeight: "700",
                                textTransform: "uppercase",
                                letterSpacing: 0.5,
                                color: colors.textMuted,
                              }}
                            >
                              Skills Detected
                            </Text>
                            <View
                              style={{
                                flexDirection: "row",
                                flexWrap: "wrap",
                                gap: 6,
                              }}
                            >
                              {parsedResume.skills.map((skill: string) => (
                                <View
                                  key={skill}
                                  style={{
                                    paddingHorizontal: 10,
                                    paddingVertical: 5,
                                    backgroundColor: "rgba(21,117,10,0.08)",
                                    borderRadius: 8,
                                  }}
                                >
                                  <Text
                                    style={{
                                      fontSize: 12,
                                      fontWeight: "600",
                                      color: Palette.accent600,
                                    }}
                                  >
                                    {skill}
                                  </Text>
                                </View>
                              ))}
                            </View>
                          </View>
                        )}

                        {/* Action buttons */}
                        <View style={{ gap: 10, marginTop: 8 }}>
                          <Pressable
                            disabled={saving}
                            onPress={handleSaveParsedResume}
                            style={[
                              s.saveBtn,
                              { backgroundColor: Palette.accent600 },
                            ]}
                          >
                            {saving ? (
                              <ActivityIndicator color="#fff" />
                            ) : (
                              <Text style={s.saveBtnText}>Save to Profile</Text>
                            )}
                          </Pressable>
                          <Pressable
                            onPress={() => {
                              setParsedResume(null);
                              setResumeParsing(false);
                            }}
                            style={[
                              s.saveBtn,
                              {
                                backgroundColor: "transparent",
                                borderWidth: 1,
                                borderColor: colors.border,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                s.saveBtnText,
                                { color: colors.textSecondary },
                              ]}
                            >
                              Upload Different File
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    ) : (
                      /* ── Step 1: Upload prompt ── */
                      <View
                        style={{
                          gap: 16,
                          alignItems: "center",
                          paddingVertical: 20,
                        }}
                      >
                        <View
                          style={{
                            width: 72,
                            height: 72,
                            borderRadius: 18,
                            backgroundColor: "rgba(245,158,11,0.1)",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Feather
                            name="file-text"
                            size={32}
                            color={Palette.warm500}
                          />
                        </View>
                        <View style={{ alignItems: "center", gap: 6 }}>
                          <Text
                            style={{
                              textAlign: "center",
                              fontSize: 15,
                              fontWeight: "700",
                              color: colors.text,
                            }}
                          >
                            Smart Resume Upload
                          </Text>
                          <Text
                            style={{
                              textAlign: "center",
                              fontSize: 13,
                              color: colors.textSecondary,
                              marginHorizontal: 16,
                              lineHeight: 18,
                            }}
                          >
                            Upload your CV and we'll automatically extract your
                            profile details — title, skills, education and more.
                          </Text>
                        </View>
                        <Pressable
                          disabled={resumeParsing}
                          onPress={handleResumeUpload}
                          style={[
                            s.saveBtn,
                            {
                              backgroundColor: Palette.accent600,
                              width: "80%",
                            },
                          ]}
                        >
                          <Text style={s.saveBtnText}>
                            Choose File (PDF / DOC)
                          </Text>
                        </Pressable>
                        <Text style={{ fontSize: 11, color: colors.textMuted }}>
                          PDF, DOC, DOCX · max 5 MB
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {activeSection === "bio" && (
                  <View style={{ gap: 14 }}>
                    <Text style={s.label}>Summary / Bio</Text>
                    <TextInput
                      value={bio}
                      onChangeText={setBio}
                      multiline
                      numberOfLines={5}
                      style={[s.textArea, { borderColor: colors.border }]}
                    />
                    <Pressable
                      disabled={saving}
                      onPress={handleSaveBio}
                      style={[
                        s.saveBtn,
                        { backgroundColor: Palette.accent600 },
                      ]}
                    >
                      {saving ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={s.saveBtnText}>Save</Text>
                      )}
                    </Pressable>
                  </View>
                )}

                {activeSection === "qualifications" && (
                  <View style={{ gap: 14 }}>
                    <Text style={s.label}>Skills (comma separated)</Text>
                    <TextInput
                      value={skills}
                      onChangeText={setSkills}
                      placeholder="Salesforce, MEDDIC, B2B"
                      style={[s.input, { borderColor: colors.border }]}
                    />
                    <Pressable
                      disabled={saving}
                      onPress={handleSaveSkills}
                      style={[
                        s.saveBtn,
                        { backgroundColor: Palette.accent600 },
                      ]}
                    >
                      {saving ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={s.saveBtnText}>Save</Text>
                      )}
                    </Pressable>
                  </View>
                )}

                {activeSection === "experience" && (
                  <View style={{ gap: 14 }}>
                    <Text style={s.label}>Years of Experience</Text>
                    <TextInput
                      value={expYears}
                      onChangeText={setExpYears}
                      keyboardType="numeric"
                      placeholder="e.g. 5"
                      style={[s.input, { borderColor: colors.border }]}
                    />
                    <Pressable
                      disabled={saving}
                      onPress={handleSaveExp}
                      style={[
                        s.saveBtn,
                        { backgroundColor: Palette.accent600 },
                      ]}
                    >
                      {saving ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={s.saveBtnText}>Save</Text>
                      )}
                    </Pressable>
                  </View>
                )}

                {activeSection === "education" && (
                  <View style={{ gap: 14 }}>
                    <Text style={s.label}>Education background</Text>
                    <TextInput
                      value={education}
                      onChangeText={setEducation}
                      style={[s.input, { borderColor: colors.border }]}
                    />
                    <Pressable
                      disabled={saving}
                      onPress={handleSaveEdu}
                      style={[
                        s.saveBtn,
                        { backgroundColor: Palette.accent600 },
                      ]}
                    >
                      {saving ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={s.saveBtnText}>Save</Text>
                      )}
                    </Pressable>
                  </View>
                )}

                {activeSection === "password" && (
                  <View style={{ gap: 14 }}>
                    <View style={s.field}>
                      <Text style={s.label}>Old Password</Text>
                      <TextInput
                        value={oldPassword}
                        onChangeText={setOldPassword}
                        secureTextEntry
                        style={[s.input, { borderColor: colors.border }]}
                      />
                    </View>
                    <View style={s.field}>
                      <Text style={s.label}>New Password</Text>
                      <TextInput
                        value={newPassword}
                        onChangeText={setNewPassword}
                        secureTextEntry
                        style={[s.input, { borderColor: colors.border }]}
                      />
                    </View>
                    <View style={s.field}>
                      <Text style={s.label}>Confirm New Password</Text>
                      <TextInput
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                        style={[s.input, { borderColor: colors.border }]}
                      />
                    </View>
                    <Pressable
                      disabled={saving}
                      onPress={handleSavePassword}
                      style={[
                        s.saveBtn,
                        { backgroundColor: Palette.accent600 },
                      ]}
                    >
                      {saving ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={s.saveBtnText}>Change Password</Text>
                      )}
                    </Pressable>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── MY TAILORED CVS LIST MODAL ── */}
      <Modal
        visible={activeSection === "generated-cvs"}
        animationType="slide"
        transparent
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={s.overlay}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => setActiveSection(null)}
            />
            <View style={[s.sheet, { backgroundColor: colors.cardBg }]}>
              <View
                style={[s.modalHeader, { borderBottomColor: colors.border }]}
              >
                <Text style={[s.modalTitle, { color: colors.text }]}>
                  My Tailored CVs
                </Text>
                <Pressable onPress={() => setActiveSection(null)}>
                  <Feather name="x" size={20} color={colors.textMuted} />
                </Pressable>
              </View>

              <ScrollView
                style={s.modalBody}
                showsVerticalScrollIndicator={false}
              >
                {cvsLoading ? (
                  <ActivityIndicator
                    size="small"
                    color={Palette.accent500}
                    style={{ marginVertical: 30 }}
                  />
                ) : generatedCVs.length === 0 ? (
                  <View style={{ padding: 24, alignItems: "center" }}>
                    <Text
                      style={{
                        fontSize: 13,
                        color: colors.textMuted,
                        textAlign: "center",
                      }}
                    >
                      You haven't generated any tailored CVs yet. Go to CV
                      Builder tab to create one.
                    </Text>
                  </View>
                ) : (
                  <View style={{ gap: 12 }}>
                    {generatedCVs.map((cv) => (
                      <View
                        key={cv.id}
                        style={[s.cvRow, { borderColor: colors.border }]}
                      >
                        <View style={{ flex: 1, gap: 2 }}>
                          <Text
                            style={{
                              fontSize: 13,
                              fontWeight: "bold",
                              color: colors.text,
                            }}
                          >
                            {cv.target_role ||
                              cv.template_name ||
                              `CV #${cv.id}`}
                          </Text>
                          <Text
                            style={{ fontSize: 10, color: colors.textMuted }}
                          >
                            {new Date(cv.generated_at).toLocaleDateString()}
                          </Text>
                        </View>
                        <Pressable
                          onPress={() => {
                            setSelectedCV(cv);
                            setPaymentVisible(true);
                          }}
                          style={[
                            s.cvDownloadBtn,
                            { backgroundColor: Palette.accent50 },
                          ]}
                        >
                          <Feather
                            name="download"
                            size={13}
                            color={Palette.accent600}
                          />
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: "bold",
                              color: Palette.accent600,
                            }}
                          >
                            Download
                          </Text>
                        </Pressable>
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── NATIVE PAYMENT MODAL ── */}
      <NativePaymentModal
        visible={paymentVisible}
        onClose={() => setPaymentVisible(false)}
        cvId={selectedCV ? selectedCV.id : null}
        cvName={
          selectedCV
            ? selectedCV.target_role || selectedCV.template_name || "cv"
            : "cv"
        }
        onSuccess={fetchCVs}
      />
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16 },
  heroCard: {
    borderRadius: BorderRadius.cardLg,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
    overflow: "hidden",
  },
  avatarWrap: { position: "relative", marginBottom: 14 },
  avatarEditBtn: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: Palette.accent500,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    padding: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImg: { width: 82, height: 82, borderRadius: 41 },
  avatarFallback: {
    width: 82,
    height: 82,
    borderRadius: 41,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: { fontSize: 32, fontWeight: "800" },
  heroName: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  heroTitle: { fontSize: FontSize.sm },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: "rgba(59,130,246,0.1)",
    borderRadius: 99,
  },
  verifiedText: { fontSize: 11, fontWeight: "700", color: Palette.blue500 },
  scoreRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  scoreLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  scoreVal: { fontSize: FontSize.sm, fontWeight: FontWeight.extrabold },
  progressBg: { width: "100%", height: 8, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },
  completionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
    borderWidth: 1,
  },
  completionText: { fontSize: 10, fontWeight: FontWeight.semibold },

  groupHeader: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionsCard: {
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    overflow: "hidden",
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
  },
  sectionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTextWrap: {
    flex: 1,
    justifyContent: "center",
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: FontWeight.bold,
  },
  sectionSub: {
    fontSize: 11,
    marginTop: 2,
  },
  actionChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
    alignItems: "center",
    justifyContent: "center",
  },
  actionChipText: {
    fontSize: 10,
    fontWeight: "800",
  },
  divider: { height: 1, marginHorizontal: 16 },

  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    borderRadius: BorderRadius.card,
  },
  signOutText: { fontSize: FontSize.base, fontWeight: FontWeight.bold },

  // Modals Sheet styles
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: BorderRadius.cardLg,
    borderTopRightRadius: BorderRadius.cardLg,
    height: SCREEN_H * 0.8,
    paddingTop: 8,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.extrabold,
  },
  modalBody: {
    padding: 20,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  input: {
    height: 42,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  textArea: {
    height: 100,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    paddingTop: 8,
    fontSize: 13,
    textAlignVertical: "top",
  },
  saveBtn: {
    height: 44,
    borderRadius: BorderRadius.button,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  saveBtnText: {
    color: "#fff",
    fontWeight: FontWeight.bold,
    fontSize: FontSize.sm,
  },
  cvRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    gap: 12,
  },
  cvDownloadBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
});
