import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/lib/theme';

export function QuantityControl({ value, onChange, min = 0, max = 9999 }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [text, setText] = useState(String(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setText(String(value));
  }, [value, focused]);

  function handleDecrement() { onChange(Math.max(min, value - 1)); }
  function handleIncrement() { onChange(Math.min(max, value + 1)); }

  function handleChangeText(t) {
    const clean = t.replace(/[^0-9]/g, '');
    setText(clean);
    const parsed = parseInt(clean, 10);
    if (!isNaN(parsed) && parsed >= min && parsed <= max) onChange(parsed);
  }

  function handleBlur() {
    setFocused(false);
    const parsed = parseInt(text, 10);
    if (isNaN(parsed) || parsed < min) { setText(String(min)); onChange(min); }
    else if (parsed > max) { setText(String(max)); onChange(max); }
    else { setText(String(parsed)); onChange(parsed); }
  }

  return (
    <View style={styles.row}>
      <TouchableOpacity style={styles.btnDecrement} onPress={handleDecrement} activeOpacity={0.7}>
        <Text style={styles.btnDecrementText}>−</Text>
      </TouchableOpacity>
      <TextInput
        style={[styles.input, focused && styles.inputFocused]}
        value={text}
        onChangeText={handleChangeText}
        onFocus={() => setFocused(true)}
        onBlur={handleBlur}
        keyboardType="number-pad"
        selectTextOnFocus
        maxLength={String(max).length || 4}
        textAlign="center"
      />
      <TouchableOpacity style={styles.btnIncrement} onPress={handleIncrement} activeOpacity={0.7}>
        <Text style={styles.btnIncrementText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

function makeStyles(c) {
  return StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 },
    btnDecrement: {
      width: 48, height: 48, borderRadius: 24,
      backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center',
    },
    btnDecrementText: { fontSize: 26, fontWeight: 'bold', color: c.text, lineHeight: 30, includeFontPadding: false },
    btnIncrement: {
      width: 48, height: 48, borderRadius: 24,
      backgroundColor: c.text, alignItems: 'center', justifyContent: 'center',
    },
    btnIncrementText: { fontSize: 26, fontWeight: 'bold', color: c.bg, lineHeight: 30, includeFontPadding: false },
    input: {
      width: 88, fontSize: 36, fontWeight: 'bold',
      color: c.text, backgroundColor: c.surface,
      borderRadius: 14, paddingVertical: 8, paddingHorizontal: 4,
      borderWidth: 2, borderColor: c.border,
    },
    inputFocused: { borderColor: c.text },
  });
}
