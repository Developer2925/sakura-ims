import React, { useCallback, useEffect, useRef } from 'react';
import {
  Animated, View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking, BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { navBack } from '@/lib/animationStore';
import { useFocusEffect } from '@react-navigation/native';
import { AppIcon, getIconBoxColor } from '@/components/AppIcons';
import { useCameraPermissions } from 'expo-camera';
import Constants from 'expo-constants';
import { useAuth } from '@/lib/auth';
import { useLang } from '@/lib/i18n';
import { useAlert } from '@/components/AlertModal';
import { useTheme } from '@/lib/theme';

const appVersion = Constants.expoConfig?.version ?? '1.0.0';

export default function SettingsScreen() {
  const { logout } = useAuth();
  const { lang, toggle, t } = useLang();
  const { showAlert, AlertComponent } = useAlert();
  const { colors, toggleTheme } = useTheme();
  const [cameraPermission] = useCameraPermissions();
  const thumbAnim = useRef(new Animated.Value(colors.isDark ? 0 : 1)).current;

  useEffect(() => {
    Animated.spring(thumbAnim, {
      toValue: colors.isDark ? 0 : 1,
      useNativeDriver: true,
      stiffness: 260,
      damping: 20,
      mass: 0.8,
    }).start();
  }, [colors.isDark]);

  const styles = makeStyles(colors);

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        navBack('/(app)/dashboard');
        return true;
      });
      return () => sub.remove();
    }, [])
  );

  function handleLogout() {
    showAlert(
      t('signOut'),
      t('signOutConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('signOut'),
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ],
      'confirm'
    );
  }

  function openSystemSettings() {
    Linking.openSettings();
  }

  const cameraGranted = cameraPermission?.granted ?? false;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navBack('/(app)/dashboard')}
          activeOpacity={0.8}
        >
          <AppIcon name="back" size={20} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('settingsTitle')}</Text>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Preferences */}
        <Text style={styles.sectionLabel}>{t('settingsPreferences')}</Text>
        <View style={styles.group}>
          <TouchableOpacity style={styles.row} onPress={toggle} activeOpacity={0.8}>
            <View style={[styles.rowIcon, { backgroundColor: getIconBoxColor('language', colors.isDark) }]}>
              <AppIcon name="language" size={20} />
            </View>
            <Text style={styles.rowLabel}>{t('settingsLanguage')}</Text>
            <View style={styles.rowRight}>
              <Text style={styles.rowValue}>{lang === 'ja' ? '日本語' : 'English'}</Text>
              <AppIcon name="forward" size={16} />
            </View>
          </TouchableOpacity>

          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <View style={[styles.rowIcon, { backgroundColor: getIconBoxColor(colors.isDark ? 'moon' : 'sun', colors.isDark) }]}>
              <AppIcon name={colors.isDark ? 'moon' : 'sun'} size={20} />
            </View>
            <Text style={styles.rowLabel}>{colors.isDark ? 'Dark Mode' : 'Light Mode'}</Text>
            <TouchableOpacity onPress={toggleTheme} activeOpacity={0.85}>
              <View style={styles.toggleTrack}>
                <Animated.View
                  style={[
                    styles.toggleThumb,
                    {
                      transform: [{
                        translateX: thumbAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [3, 24],
                        }),
                      }],
                    },
                  ]}
                >
                  <AppIcon name={colors.isDark ? 'moon' : 'sun'} size={13} />
                </Animated.View>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Account */}
        <Text style={styles.sectionLabel}>{t('settingsAccount')}</Text>
        <View style={styles.group}>
          <TouchableOpacity style={styles.row} onPress={() => router.push('/(app)/profile')} activeOpacity={0.8}>
            <View style={[styles.rowIcon, { backgroundColor: getIconBoxColor('person', colors.isDark) }]}>
              <AppIcon name="person" size={20} />
            </View>
            <Text style={styles.rowLabel}>Profile</Text>
            <AppIcon name="forward" size={16} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.row, { borderBottomWidth: 0 }]} onPress={handleLogout} activeOpacity={0.8}>
            <View style={[styles.rowIcon, styles.rowIconDestructive]}>
              <AppIcon name="logout" size={20} color="#E8909D" />
            </View>
            <Text style={[styles.rowLabel, styles.rowLabelDestructive]}>{t('settingsLogout')}</Text>
            <AppIcon name="forward" size={16} />
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <Text style={styles.sectionLabel}>{t('settingsAppInfo')}</Text>
        <View style={styles.group}>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <View style={[styles.rowIcon, { backgroundColor: getIconBoxColor('info', colors.isDark) }]}>
              <AppIcon name="info" size={20} />
            </View>
            <Text style={styles.rowLabel}>{t('settingsVersion')}</Text>
            <Text style={styles.rowValueMuted}>{appVersion}</Text>
          </View>
        </View>

        {/* Permissions */}
        <Text style={styles.sectionLabel}>{t('settingsPermissionsSection')}</Text>
        <View style={styles.group}>
          <TouchableOpacity style={[styles.row, { borderBottomWidth: 0 }]} onPress={openSystemSettings} activeOpacity={0.8}>
            <View style={[styles.rowIcon, { backgroundColor: getIconBoxColor('camera', colors.isDark) }]}>
              <AppIcon name="camera" size={20} />
            </View>
            <Text style={styles.rowLabel}>{t('settingsCameraPermission')}</Text>
            <View style={styles.rowRight}>
              <View style={[styles.permBadge, cameraGranted ? styles.permGranted : styles.permDenied]}>
                <Text style={[styles.permBadgeText, cameraGranted ? styles.permGrantedText : styles.permDeniedText]}>
                  {cameraGranted ? t('settingsPermissionGranted') : t('settingsPermissionDenied')}
                </Text>
              </View>
              <AppIcon name="forward" size={16} />
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.permHint}>{t('settingsOpenSettings')}</Text>

        <View style={{ height: 40 }} />
      </ScrollView>

      {AlertComponent}
    </SafeAreaView>
  );
}

function makeStyles(c) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    header: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14, gap: 14,
      backgroundColor: c.bg,
    },
    backBtn: {
      width: 40, height: 40, borderRadius: 14,
      backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center',
    },
    title: { fontSize: 22, fontWeight: '800', color: c.text, letterSpacing: -0.3 },
    content: { paddingHorizontal: 20, paddingTop: 8 },

    sectionLabel: {
      fontSize: 11, fontWeight: '700', color: c.textMuted,
      textTransform: 'uppercase', letterSpacing: 0.8,
      marginBottom: 8, marginTop: 20, marginLeft: 4,
    },
    group: { backgroundColor: c.surface, borderRadius: 18, overflow: 'hidden' },
    row: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 16, paddingVertical: 14, gap: 14,
      borderBottomWidth: 1, borderBottomColor: c.border,
    },
    rowIcon: {
      width: 36, height: 36, borderRadius: 10,
      alignItems: 'center', justifyContent: 'center',
    },
    rowIconDestructive: { backgroundColor: 'rgba(232,144,157,0.12)' },
    rowLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: c.text },
    rowLabelDestructive: { color: '#E8909D' },
    rowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    rowValue: { fontSize: 14, color: c.textMuted, fontWeight: '500' },
    rowValueMuted: { fontSize: 14, color: c.textMuted, fontWeight: '500' },

    permBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    permGranted: { backgroundColor: 'rgba(76,217,196,0.15)' },
    permDenied: { backgroundColor: 'rgba(232,144,157,0.15)' },
    permBadgeText: { fontSize: 12, fontWeight: '700' },
    permGrantedText: { color: '#4CD9C4' },
    permDeniedText: { color: '#E8909D' },

    permHint: { fontSize: 12, color: c.textMuted, marginTop: 8, marginLeft: 4 },

    toggleTrack: {
      width: 50,
      height: 28,
      borderRadius: 14,
      backgroundColor: c.isDark ? '#3D3D3D' : '#C8C8C8',
      justifyContent: 'center',
    },
    toggleThumb: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: c.isDark ? '#686868' : '#0F0F0F',
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
