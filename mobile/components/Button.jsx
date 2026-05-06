import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View, StyleSheet } from 'react-native';
import { useTheme } from '@/lib/theme';

export function Button({ title, onPress, variant = 'primary', loading, disabled }) {
  const { colors } = useTheme();

  const VARIANTS = {
    primary:   { bg: colors.text,                    text: colors.bg,   borderWidth: 0, borderColor: 'transparent' },
    secondary: { bg: 'rgba(129,128,126,0.15)',        text: colors.text, borderWidth: 0, borderColor: 'transparent' },
    danger:    { bg: 'rgba(129,128,126,0.15)',        text: colors.text, borderWidth: 1, borderColor: 'rgba(129,128,126,0.4)' },
  };

  const v = VARIANTS[variant] ?? VARIANTS.primary;

  return (
    <TouchableOpacity
      style={[
        styles.btn,
        { backgroundColor: v.bg, borderWidth: v.borderWidth, borderColor: v.borderColor },
        (disabled || loading) && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading && (
        <View style={{ marginRight: 8 }}>
          <ActivityIndicator color={v.text} size="small" />
        </View>
      )}
      <Text style={[styles.btnText, { color: v.text }]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  disabled: { opacity: 0.6 },
  btnText: { fontSize: 16, fontWeight: '700' },
});
