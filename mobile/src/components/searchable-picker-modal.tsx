import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Pressable,
  FlatList,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  BackHandler,
} from 'react-native';
import { Text, TextInput } from '@/components/ui/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { Palette } from '../constants/theme';

export interface PickerItem {
  label: string;
  value: string;
  flag?: string;
  badge?: string;
  subtitle?: string;
}

interface SearchablePickerModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  items: PickerItem[];
  selectedValue?: string;
  onSelect: (item: PickerItem) => void;
  placeholder?: string;
  emptyMessage?: string;
  allowCustom?: boolean;
}

export const SearchablePickerModal: React.FC<SearchablePickerModalProps> = ({
  visible,
  onClose,
  title,
  items,
  selectedValue,
  onSelect,
  placeholder = "Search...",
  emptyMessage = "No items found",
  allowCustom = true,
}) => {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");

  // Reset search when modal opens
  useEffect(() => {
    if (visible) {
      setSearch("");
    }
  }, [visible]);

  // Handle hardware back button on Android
  useEffect(() => {
    if (!visible) return;
    const backSub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => backSub.remove();
  }, [visible, onClose]);

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase().trim();
    return items.filter(
      item =>
        item.label.toLowerCase().includes(q) ||
        (item.badge && item.badge.toLowerCase().includes(q)) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
        item.value.toLowerCase().includes(q)
    );
  }, [items, search]);

  const handleSelectItem = (item: PickerItem) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // ignore
    }
    onSelect(item);
    onClose();
  };

  const handleSelectCustom = () => {
    const trimmed = search.trim();
    if (!trimmed) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // ignore
    }
    onSelect({
      label: trimmed,
      value: trimmed,
    });
    onClose();
  };

  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      style={s.overlay}
    >
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={s.keyboardContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <Animated.View
          entering={SlideInDown.springify().damping(24).mass(0.8)}
          exiting={SlideOutDown}
          style={[
            s.sheet,
            { paddingBottom: Math.max(insets.bottom, 20) }
          ]}
        >
          {/* Seamless bottom background fill to cover safe area and prevent any gap */}
          <View style={s.bottomFill} />

          {/* Grab handle indicator */}
          <View style={s.handleContainer}>
            <View style={s.handle} />
          </View>

          {/* Header */}
          <View style={s.header}>
            <Text style={s.headerTitle}>{title}</Text>
            <Pressable
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={s.closeBtn}
            >
              <Feather name="x" size={20} color={Palette.neutral500} />
            </Pressable>
          </View>

          {/* Search Input Box */}
          <View style={s.searchContainer}>
            <Feather name="search" size={18} color={Palette.neutral400} style={s.searchIcon} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={placeholder}
              placeholderTextColor={Palette.neutral400}
              style={s.searchInput}
              autoCorrect={false}
              autoCapitalize="none"
              clearButtonMode="while-editing"
            />
            {search.length > 0 && Platform.OS !== 'ios' && (
              <Pressable onPress={() => setSearch("")} style={s.clearBtn}>
                <Feather name="x-circle" size={16} color={Palette.neutral400} />
              </Pressable>
            )}
          </View>

          {/* Item List */}
          <FlatList
            data={filteredItems}
            keyExtractor={(item, idx) => `${item.value}-${idx}`}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={true}
            contentContainerStyle={s.listContent}
            style={s.list}
            renderItem={({ item }) => {
              const isSelected = selectedValue?.toLowerCase() === item.value.toLowerCase() ||
                                 selectedValue?.toLowerCase() === item.label.toLowerCase();
              return (
                <Pressable
                  onPress={() => handleSelectItem(item)}
                  style={({ pressed }) => [
                    s.itemRow,
                    isSelected && s.itemRowSelected,
                    pressed && s.itemRowPressed,
                  ]}
                >
                  <View style={s.itemMain}>
                    {item.flag ? (
                      <Text style={s.itemFlag}>{item.flag}</Text>
                    ) : null}
                    <View style={s.itemTexts}>
                      <Text
                        style={[s.itemLabel, isSelected && s.itemLabelSelected]}
                        numberOfLines={1}
                      >
                        {item.label}
                      </Text>
                      {item.subtitle ? (
                        <Text style={s.itemSubtitle} numberOfLines={1}>
                          {item.subtitle}
                        </Text>
                      ) : null}
                    </View>
                  </View>

                  <View style={s.itemTrailing}>
                    {item.badge ? (
                      <View style={[s.badge, isSelected && s.badgeSelected]}>
                        <Text style={[s.badgeText, isSelected && s.badgeTextSelected]}>
                          {item.badge}
                        </Text>
                      </View>
                    ) : null}
                    {isSelected ? (
                      <View style={s.checkCircle}>
                        <Feather name="check" size={14} color="#ffffff" />
                      </View>
                    ) : null}
                  </View>
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <View style={s.emptyState}>
                <Feather name="alert-circle" size={28} color={Palette.neutral400} />
                <Text style={s.emptyText}>{emptyMessage}</Text>
                {allowCustom && search.trim().length > 0 ? (
                  <Pressable
                    onPress={handleSelectCustom}
                    style={({ pressed }) => [
                      s.customBtn,
                      pressed && { opacity: 0.8 },
                    ]}
                  >
                    <Feather name="plus-circle" size={16} color={Palette.accent600} />
                    <Text style={s.customBtnText}>
                      Use &quot;{search.trim()}&quot;
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            }
          />
        </Animated.View>
      </KeyboardAvoidingView>
    </Animated.View>
  );
};

const s = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    zIndex: 99999,
    elevation: 99999,
    margin: 0,
    padding: 0,
  },
  keyboardContainer: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    height: '80%',
    maxHeight: '88%',
    width: '100%',
    maxWidth: 580,
    alignSelf: 'center',
    marginBottom: 0,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 24,
  },
  bottomFill: {
    position: 'absolute',
    bottom: -200,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: '#ffffff',
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Palette.neutral300,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Palette.neutral100,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Palette.neutral900,
    letterSpacing: -0.3,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: Palette.neutral100,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.neutral50,
    borderRadius: 14,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    minHeight: 46,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Palette.neutral900,
    height: '100%',
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingBottom: 24,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 4,
    backgroundColor: '#ffffff',
  },
  itemRowPressed: {
    backgroundColor: Palette.neutral100,
  },
  itemRowSelected: {
    backgroundColor: Palette.accent50,
  },
  itemMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  itemFlag: {
    fontSize: 22,
    marginRight: 12,
  },
  itemTexts: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: Palette.neutral800,
  },
  itemLabelSelected: {
    color: Palette.accent700,
    fontWeight: '700',
  },
  itemSubtitle: {
    fontSize: 12,
    color: Palette.neutral500,
    marginTop: 1,
  },
  itemTrailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: Palette.neutral100,
  },
  badgeSelected: {
    backgroundColor: Palette.accent100,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.neutral600,
  },
  badgeTextSelected: {
    color: Palette.accent700,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Palette.accent600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Palette.neutral500,
    textAlign: 'center',
  },
  customBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Palette.accent50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Palette.accent200,
  },
  customBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Palette.accent700,
  },
});
