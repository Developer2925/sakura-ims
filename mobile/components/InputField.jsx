import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useTheme } from '@/lib/theme';

export function InputField({ label, error, ...props }) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, error ? styles.inputErr : null]}
        placeholderTextColor={colors.textMuted}
        {...props}
      />
      {error ? <Text style={styles.errText}>{error}</Text> : null}
    </View>
  );
}

function makeStyles(c) {
  return StyleSheet.create({
    wrap: { marginBottom: 16 },
    label: { fontSize: 13, fontWeight: '700', color: c.textMuted, marginBottom: 8 },
    input: {
      backgroundColor: c.surface,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 15,
      color: c.text,
      borderWidth: 1.5,
      borderColor: 'rgba(129,128,126,0.25)',
    },
    inputErr: {
      borderColor: 'rgba(129,128,126,0.6)',
      backgroundColor: 'rgba(129,128,126,0.08)',
    },
    errText: { fontSize: 12, color: c.textMuted, marginTop: 6 },
  });
}
