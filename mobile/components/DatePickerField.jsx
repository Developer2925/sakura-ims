import React, { useMemo, useState } from 'react';
import { AppIcon } from '@/components/AppIcons';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '@/lib/theme';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS   = ['Su','Mo','Tu','We','Th','Fr','Sa'];
const CELL_SIZE = 40;

function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function firstDayOf(y, m)  { return new Date(y, m, 1).getDay(); }

export function DatePickerField({ label, value, onChange, error }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const today  = new Date();
  const parsed = value ? new Date(value + 'T00:00:00') : null;

  const [open, setOpen]       = useState(false);
  const [viewYear, setYear]   = useState(parsed?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setMonth] = useState(parsed?.getMonth()    ?? today.getMonth());

  function shiftMonth(delta) {
    let m = viewMonth + delta, y = viewYear;
    if (m > 11) { m = 0; y++; }
    if (m < 0)  { m = 11; y--; }
    setMonth(m); setYear(y);
  }

  function pickDay(day) {
    onChange(`${viewYear}-${String(viewMonth + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`);
    setOpen(false);
  }

  function openPicker() {
    const base = parsed ?? today;
    setYear(base.getFullYear()); setMonth(base.getMonth()); setOpen(true);
  }

  const displayLabel = parsed
    ? `${parsed.getDate()} ${MONTHS[parsed.getMonth()]} ${parsed.getFullYear()}`
    : null;

  const totalDays  = daysInMonth(viewYear, viewMonth);
  const startBlank = firstDayOf(viewYear, viewMonth);

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <TouchableOpacity style={[styles.trigger, error && styles.triggerErr]} onPress={openPicker} activeOpacity={0.8}>
        <AppIcon name="calendar" size={16} color={value ? colors.text : colors.textMuted} />
        <Text style={[styles.triggerText, !value && styles.placeholder]}>
          {displayLabel ?? 'Select date'}
        </Text>
        <AppIcon name="chevronDown" size={14} />
      </TouchableOpacity>

      {error ? <Text style={styles.errText}>{error}</Text> : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>

            <View style={styles.calHeader}>
              <TouchableOpacity onPress={() => shiftMonth(-1)} style={styles.navBtn}>
                <AppIcon name="back" size={18} />
              </TouchableOpacity>
              <Text style={styles.monthLabel}>{MONTHS[viewMonth]} {viewYear}</Text>
              <TouchableOpacity onPress={() => shiftMonth(1)} style={styles.navBtn}>
                <AppIcon name="forward" size={18} />
              </TouchableOpacity>
            </View>

            <View style={styles.dowRow}>
              {DAYS.map((d) => <Text key={d} style={styles.dowText}>{d}</Text>)}
            </View>

            <View style={styles.grid}>
              {Array.from({ length: startBlank }).map((_, i) => (
                <View key={`e${i}`} style={styles.cell} />
              ))}
              {Array.from({ length: totalDays }).map((_, i) => {
                const day = i + 1;
                const iso = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                const selected = iso === value;
                const isToday  = day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
                return (
                  <TouchableOpacity
                    key={day}
                    style={[styles.cell, selected && styles.cellSelected, isToday && !selected && styles.cellToday]}
                    onPress={() => pickDay(day)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.cellText, selected && styles.cellTextSelected, isToday && !selected && styles.cellTextToday]}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity style={styles.clearBtn} onPress={() => { onChange(''); setOpen(false); }}>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>

          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function makeStyles(c) {
  return StyleSheet.create({
    wrap:  { marginBottom: 16 },
    label: { fontSize: 13, fontWeight: '700', color: c.textMuted, marginBottom: 8 },

    trigger: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      backgroundColor: c.surface, borderRadius: 16,
      paddingHorizontal: 16, paddingVertical: 14,
      borderWidth: 1.5, borderColor: c.border,
    },
    triggerErr:  { borderColor: 'rgba(129,128,126,0.6)' },
    triggerText: { flex: 1, fontSize: 15, fontWeight: '500', color: c.text },
    placeholder: { color: c.textMuted },
    errText:     { fontSize: 12, color: c.textMuted, marginTop: 6 },

    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center' },
    sheet: {
      backgroundColor: c.surface, borderRadius: 24,
      padding: 20, width: 320,
      borderWidth: 1, borderColor: c.border,
    },

    calHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    navBtn:    { padding: 8 },
    monthLabel: { fontSize: 16, fontWeight: '700', color: c.text },

    dowRow:  { flexDirection: 'row', marginBottom: 6 },
    dowText: { width: CELL_SIZE, textAlign: 'center', fontSize: 11, fontWeight: '600', color: c.textMuted },

    grid:     { flexDirection: 'row', flexWrap: 'wrap' },
    cell:     { width: CELL_SIZE, height: CELL_SIZE, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
    cellText: { fontSize: 14, color: c.text },

    cellSelected:     { backgroundColor: c.text },
    cellTextSelected: { color: c.bg, fontWeight: '700' },
    cellToday:        { borderWidth: 1.5, borderColor: c.textMuted },
    cellTextToday:    { color: c.text, fontWeight: '700' },

    clearBtn: {
      marginTop: 16, paddingVertical: 12, borderRadius: 12,
      backgroundColor: 'rgba(129,128,126,0.15)', alignItems: 'center',
    },
    clearText: { fontSize: 13, fontWeight: '600', color: c.textMuted },
  });
}
