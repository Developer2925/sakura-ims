import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
  ScrollView, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { navBack } from '@/lib/animationStore';
import { AppIcon, getIconBoxColor } from '@/components/AppIcons';
import { DatePickerField } from '@/components/DatePickerField';
import { QuantityControl } from '@/components/QuantityControl';
import { api } from '@/lib/api';
import { useLang } from '@/lib/i18n';
import { useAlert } from '@/components/AlertModal';
import { useTheme } from '@/lib/theme';

function formatExpiry(dateStr) {
  if (!dateStr) return null;
  return String(dateStr).split('T')[0];
}

const CONDITION_VALUES = ['新品', '良好', '普通', '期限切れ'];
const CONDITION_KEYS   = ['cond_new', 'cond_good', 'cond_fair', 'cond_expired'];

export default function AddStockScreen() {
  const { itemId, itemName, currentQty, price, category, conditionStatus } = useLocalSearchParams();
  const { t, tCondition } = useLang();
  const { showAlert, AlertComponent } = useAlert();
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);

  const [mode, setMode] = useState('existing');
  const [batches, setBatches] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(true);
  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [newPrice, setNewPrice] = useState('');
  const [newExpiry, setNewExpiry] = useState('');
  const [newCondition, setNewCondition] = useState(conditionStatus || '新品');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getItemBatches(Number(itemId))
      .then(({ batches: data }) => {
        setBatches(data);
        if (data.length > 0) setSelectedBatchId(data[0].id);
      })
      .catch(() => {
        setBatches([]);
      })
      .finally(() => setLoadingBatches(false));
  }, [itemId]);

  const doAddStock = useCallback(async () => {
    setSaving(true);
    try {
      const options =
        mode === 'existing'
          ? { batchId: selectedBatchId }
          : { price: parseFloat(newPrice), expiryDate: newExpiry.trim() || undefined, conditionStatus: newCondition };

      const { newQuantity } = await api.addStock(Number(itemId), quantity, options);
      showAlert(t('success'), `${itemName}\n+${quantity}${t('pieces')} → ${t('inStock')}: ${newQuantity}${t('pieces')}`, [{ text: t('confirm'), onPress: () => navBack('/(app)/dashboard') }], 'success');
    } catch (err) {
      showAlert(t('error'), err.message || t('error'), undefined, 'error');
    } finally {
      setSaving(false);
    }
  }, [mode, selectedBatchId, newPrice, newExpiry, newCondition, itemId, itemName, quantity, t]);

  const handleConfirm = useCallback(() => {
    if (mode === 'existing') {
      if (!selectedBatchId) {
        showAlert(t('error'), t('selectBatch'), undefined, 'error');
        return;
      }
    } else {
      const p = parseFloat(newPrice);
      if (isNaN(p) || p < 0) {
        showAlert(t('error'), t('validBatchPrice'), undefined, 'error');
        return;
      }
    }

    showAlert(
      t('confirmAddStockTitle'),
      t('confirmAddStockMsg'),
      [
        { text: t('cancel'), style: 'cancel' },
        { text: t('confirm'), onPress: doAddStock },
      ],
      'confirm',
    );
  }, [mode, selectedBatchId, newPrice, t, doAddStock]);

  const selectedBatch = batches.find((b) => b.id === selectedBatchId);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navBack('/(app)/dashboard')} activeOpacity={0.8}>
          <AppIcon name="back" size={20} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('addStockTitle')}</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Item info */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={[styles.iconBox, { backgroundColor: getIconBoxColor('item', colors.isDark) }]}>
                <AppIcon name="item" size={26} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.catLabel}>{category}</Text>
                <Text style={styles.itemName} numberOfLines={2}>{itemName}</Text>
              </View>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statNum}>{currentQty}</Text>
                <Text style={styles.statLabel}>{t('currentStock')}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statNum}>{batches.length}</Text>
                <Text style={styles.statLabel}>{t('batches')}</Text>
              </View>
            </View>
          </View>

          {/* Mode toggle */}
          <View style={styles.modeToggle}>
            <TouchableOpacity
              style={[styles.modeBtn, mode === 'existing' && styles.modeBtnActive]}
              onPress={() => setMode('existing')}
              activeOpacity={0.8}
            >
              <AppIcon name="batches" size={15} color={mode === 'existing' ? colors.bg : undefined} />
              <Text style={[styles.modeBtnText, mode === 'existing' && styles.modeBtnTextActive]}>
                {t('batchModeExisting')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeBtn, mode === 'new' && styles.modeBtnActive]}
              onPress={() => setMode('new')}
              activeOpacity={0.8}
            >
              <AppIcon name="addCircleOutline" size={15} color={mode === 'new' ? colors.bg : undefined} />
              <Text style={[styles.modeBtnText, mode === 'new' && styles.modeBtnTextActive]}>
                {t('batchModeNew')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Existing batch selection */}
          {mode === 'existing' && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{t('selectBatchHint')}</Text>
              {loadingBatches ? (
                <ActivityIndicator color={colors.text} style={{ marginTop: 12 }} />
              ) : batches.length === 0 ? (
                <View style={styles.emptyBatches}>
                  <AppIcon name="batches" size={32} />
                  <Text style={styles.emptyBatchText}>{t('noBatchesYet')}</Text>
                </View>
              ) : (
                batches.map((batch) => {
                  const active = batch.id === selectedBatchId;
                  return (
                    <TouchableOpacity
                      key={batch.id}
                      style={[styles.batchCard, active && styles.batchCardActive]}
                      onPress={() => setSelectedBatchId(batch.id)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.batchCardLeft}>
                        <View style={styles.batchPriceRow}>
                          <AppIcon name="price" size={13} color={active ? colors.text : undefined} />
                          <Text style={[styles.batchPrice, active && styles.batchPriceActive]}>
                            ¥{Number(batch.price).toFixed(2)}
                          </Text>
                        </View>
                        <View style={styles.batchExpiryRow}>
                          <AppIcon name="calendar" size={12} color={active ? colors.text : undefined} />
                          <Text style={[styles.batchExpiry, active && styles.batchExpiryActive]}>
                            {formatExpiry(batch.expiry_date) || '—'}
                          </Text>
                        </View>
                        {batch.condition_status ? (
                          <View style={styles.batchExpiryRow}>
                            <AppIcon name="checkCircleOutline" size={12} color={active ? colors.text : undefined} />
                            <Text style={[styles.batchExpiry, active && styles.batchExpiryActive]}>
                              {tCondition(batch.condition_status)}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      <View style={[styles.batchQtyBadge, active && styles.batchQtyBadgeActive]}>
                        <Text style={styles.batchQtyNum}>{batch.quantity}</Text>
                        <Text style={styles.batchQtyLabel}>{t('inStock')}</Text>
                      </View>
                      {active && (
                        <View style={styles.checkMark}>
                          <AppIcon name="checkCircle" size={20} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          )}

          {/* New batch fields */}
          {mode === 'new' && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{t('addNewBatchTitle')}</Text>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>{t('newBatchPriceLabel')}</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={newPrice}
                  onChangeText={setNewPrice}
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                />
              </View>
              <DatePickerField
                label={t('newBatchExpiryLabel')}
                value={newExpiry}
                onChange={setNewExpiry}
              />
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>{t('newBatchConditionLabel')}</Text>
                <View style={styles.conditionChips}>
                  {CONDITION_VALUES.map((val, idx) => (
                    <TouchableOpacity
                      key={val}
                      style={[styles.condChip, newCondition === val && styles.condChipActive]}
                      onPress={() => setNewCondition(val)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.condChipText, newCondition === val && styles.condChipTextActive]}>
                        {t(CONDITION_KEYS[idx])}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* Quantity selector */}
          <View style={styles.previewCard}>
            <Text style={styles.previewLabel}>{t('quantityToAdd')}</Text>
            <QuantityControl value={quantity} onChange={setQuantity} min={1} max={9999} />
            {(mode === 'existing' && selectedBatch) || mode === 'new' ? (
              <View style={styles.previewResult}>
                <AppIcon name="arrowRightOutline" size={16} />
                <Text style={styles.previewText}>
                  {Number(currentQty)} + {quantity} ={' '}
                  <Text style={styles.previewTotal}>{Number(currentQty) + quantity}</Text>
                  {' '}{t('inStock')}
                </Text>
              </View>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.ctaBtn, (mode === 'existing' && !selectedBatchId && !loadingBatches) && styles.ctaBtnDisabled]}
          onPress={handleConfirm}
          activeOpacity={0.85}
          disabled={saving || (mode === 'existing' && !selectedBatchId && !loadingBatches)}
        >
          {saving
            ? <ActivityIndicator color={colors.bg} />
            : <Text style={styles.ctaBtnText}>+ {quantity} {t('pieces')} {t('addStockTitle')}</Text>}
        </TouchableOpacity>
      </View>
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
    title: { fontSize: 20, fontWeight: '800', color: c.text, flex: 1 },
    content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40, gap: 16 },

    infoCard: { backgroundColor: c.surface, borderRadius: 20, padding: 16, gap: 14 },
    infoRow: { flexDirection: 'row', alignItems: 'center' },
    iconBox: {
      width: 52, height: 52, borderRadius: 14,
      alignItems: 'center', justifyContent: 'center',
    },
    catLabel: { fontSize: 11, color: c.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
    itemName: { fontSize: 17, fontWeight: '800', color: c.text, marginTop: 2 },
    statsRow: {
      flexDirection: 'row', backgroundColor: c.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', borderRadius: 14, overflow: 'hidden',
    },
    statBox: { flex: 1, alignItems: 'center', paddingVertical: 12 },
    statDivider: { width: 1, backgroundColor: 'rgba(129,128,126,0.2)' },
    statNum: { fontSize: 20, fontWeight: '800', color: c.text },
    statLabel: { fontSize: 11, color: c.textMuted, marginTop: 2 },

    modeToggle: {
      flexDirection: 'row', backgroundColor: 'rgba(129,128,126,0.1)', borderRadius: 16, padding: 4, gap: 4,
    },
    modeBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 6, paddingVertical: 10, borderRadius: 12,
    },
    modeBtnActive: { backgroundColor: c.text },
    modeBtnText: { fontSize: 13, fontWeight: '600', color: c.textMuted },
    modeBtnTextActive: { color: c.bg },

    section: { gap: 10 },
    sectionLabel: { fontSize: 13, fontWeight: '700', color: c.textMuted, paddingBottom: 2 },

    batchCard: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: c.surface, borderRadius: 16,
      padding: 14, borderWidth: 1.5, borderColor: c.border, gap: 12,
    },
    batchCardActive: { borderColor: c.text, backgroundColor: c.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
    batchCardLeft: { flex: 1, gap: 5 },
    batchPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    batchPrice: { fontSize: 15, fontWeight: '700', color: c.textMuted },
    batchPriceActive: { color: c.text },
    batchExpiryRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    batchExpiry: { fontSize: 12, color: c.textMuted },
    batchExpiryActive: { color: c.text },
    batchQtyBadge: {
      alignItems: 'center', backgroundColor: c.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', borderRadius: 10, padding: 8, minWidth: 52,
    },
    batchQtyBadgeActive: { backgroundColor: c.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' },
    batchQtyNum: { fontSize: 16, fontWeight: '800', color: c.text },
    batchQtyLabel: { fontSize: 9, color: c.textMuted, marginTop: 1 },
    checkMark: { position: 'absolute', top: 8, right: 8 },

    emptyBatches: { alignItems: 'center', paddingVertical: 24, gap: 8 },
    emptyBatchText: { fontSize: 13, color: c.textMuted },

    fieldRow: {
      backgroundColor: c.surface, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, gap: 8,
    },
    fieldLabel: { fontSize: 11, fontWeight: '700', color: c.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 },
    fieldInput: { fontSize: 16, fontWeight: '600', color: c.text },
    conditionChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    condChip: {
      paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
      backgroundColor: c.border, borderWidth: 1.5, borderColor: 'transparent',
    },
    condChipActive: { backgroundColor: c.border2, borderColor: c.text },
    condChipText: { fontSize: 13, fontWeight: '600', color: c.textMuted },
    condChipTextActive: { color: c.text },

    previewCard: {
      backgroundColor: c.surface, borderRadius: 20, padding: 20,
      alignItems: 'center', gap: 16,
    },
    previewLabel: { fontSize: 14, fontWeight: '700', color: c.textMuted },
    previewResult: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
    previewText: { fontSize: 15, color: c.textMuted, fontWeight: '500' },
    previewTotal: { fontSize: 18, fontWeight: '800', color: c.text },

    footer: {
      paddingHorizontal: 20, paddingBottom: 36, paddingTop: 12,
      borderTopWidth: 1, borderTopColor: c.border,
      backgroundColor: c.bg,
    },
    ctaBtn: {
      backgroundColor: c.text, borderRadius: 20,
      paddingVertical: 18, alignItems: 'center',
    },
    ctaBtnDisabled: { opacity: 0.4 },
    ctaBtnText: { color: c.bg, fontSize: 16, fontWeight: '700' },
  });
}
