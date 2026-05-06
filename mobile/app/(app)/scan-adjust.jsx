import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, Stack, useNavigation } from 'expo-router';
import { navBack } from '@/lib/animationStore';
import { AppIcon } from '@/components/AppIcons';
import { QuantityControl } from '@/components/QuantityControl';
import { api } from '@/lib/api';
import { useLang } from '@/lib/i18n';
import { useAlert } from '@/components/AlertModal';
import { useTheme } from '@/lib/theme';

export default function ScanAdjustScreen() {
  const navigation = useNavigation();

  useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', (e) => {
      e.preventDefault();
      navBack('/(app)/dashboard');
    });
    return unsub;
  }, [navigation]);

  const { barcode, noBarcode } = useLocalSearchParams();
  const { t, tCondition } = useLang();
  const { showAlert, AlertComponent } = useAlert();
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const isNoBarcode = noBarcode === 'true';

  const [phase, setPhase] = useState('loading');
  const [item, setItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [allNoBarcodeItems, setAllNoBarcodeItems] = useState([]);
  const [searching, setSearching] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [saving, setSaving] = useState(false);
  const searchTimer = useRef(null);

  useEffect(() => {
    if (isNoBarcode) {
      // Load full inventory and filter to no-barcode items
      setSearching(true);
      api.getInventory()
        .then(({ items }) => {
          const noCodeItems = items.filter((i) => !i.barcode);
          setAllNoBarcodeItems(noCodeItems);
          setSearchResults(noCodeItems);
          setPhase('nobarcode');
        })
        .catch(() => setPhase('nobarcode'))
        .finally(() => setSearching(false));
      return;
    }

    if (!barcode) { setPhase('search'); return; }
    api.checkBarcode(barcode)
      .then(({ exists, items }) => {
        if (exists && items.length > 0) { setItem(items[0]); setPhase('found'); }
        else { setPhase('search'); }
      })
      .catch(() => setPhase('search'));
  }, [barcode, isNoBarcode]);

  // Filter no-barcode list by search query
  useEffect(() => {
    if (!isNoBarcode) return;
    if (!searchQuery.trim()) {
      setSearchResults(allNoBarcodeItems);
      return;
    }
    const q = searchQuery.toLowerCase();
    setSearchResults(
      allNoBarcodeItems.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q) ||
          (i.manufacturer || '').toLowerCase().includes(q) ||
          (i.internal_id || '').toLowerCase().includes(q)
      )
    );
  }, [searchQuery, allNoBarcodeItems, isNoBarcode]);

  const doSearch = useCallback((q) => {
    clearTimeout(searchTimer.current);
    if (!q.trim()) { setSearchResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const { items } = await api.searchItems(q);
        setSearchResults(items);
      } finally {
        setSearching(false);
      }
    }, 300);
  }, []);

  function selectItem(selected) {
    setItem(selected);
    setQuantity(1);
    setPhase('confirm');
  }

  const doUseItem = useCallback(async () => {
    if (!item) return;
    setSaving(true);
    try {
      const { remaining } = await api.useItem(item.id, quantity);
      showAlert(t('useSuccess'), `${item.name}\n${t('usedItems')}: ${quantity}${t('pieces')} · ${t('remaining')}: ${remaining}${t('pieces')}`, [{ text: t('confirm'), onPress: () => navBack('/(app)/dashboard') }], 'success');
    } catch (err) {
      showAlert(t('error'), err.message || t('error'), undefined, 'error');
    } finally {
      setSaving(false);
    }
  }, [item, quantity, t]);

  const handleConfirm = useCallback(() => {
    if (!item) return;
    if (item.quantity < quantity) {
      showAlert(t('insufficientStock'), `${t('inStock')}: ${item.quantity}${t('pieces')}`, undefined, 'warning');
      return;
    }
    showAlert(
      t('confirmUseTitle'),
      t('confirmUseMsg'),
      [
        { text: t('cancel'), style: 'cancel' },
        { text: t('confirm'), onPress: doUseItem },
      ],
      'confirm',
    );
  }, [item, quantity, t, doUseItem]);

  if (phase === 'loading') {
    return (
      <SafeAreaView style={styles.screen}>
        <Header onBack={() => navBack('/(app)/dashboard')} title={t('useItem')} styles={styles} />
        <View style={styles.center}><ActivityIndicator size="large" color={colors.text} /></View>
        {AlertComponent}
      </SafeAreaView>
    );
  }

  // No-barcode list mode
  if (phase === 'nobarcode') {
    return (
      <SafeAreaView style={styles.screen}>
        <Header onBack={() => navBack('/(app)/dashboard')} title={t('useItem')} styles={styles} />

        <View style={styles.noBarcodeHeader}>
          <View style={styles.noBarcodeBadge}>
            <AppIcon name="list" size={14} />
            <Text style={styles.noBarcodeLabel}>{t('noBarcode')}</Text>
          </View>
        </View>

        <View style={styles.searchWrap}>
          <AppIcon name="search" size={16} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('searchByName')}
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
            autoFocus
          />
          {searching && <ActivityIndicator size="small" color={colors.text} />}
          {!searching && searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <AppIcon name="closeCircle" size={16} />
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={searchResults}
          keyExtractor={(i) => String(i.id)}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            searching ? null : (
              <View style={styles.emptyBox}>
                <AppIcon name="item" size={44} />
                <Text style={styles.emptyText}>
                  {allNoBarcodeItems.length === 0 ? t('noInventory') : t('noResults')}
                </Text>
              </View>
            )
          }
          renderItem={({ item: it }) => (
            <TouchableOpacity style={styles.resultCard} onPress={() => selectItem(it)} activeOpacity={0.8}>
              <View style={styles.resultLeft}>
                <Text style={styles.resultName} numberOfLines={1}>{it.name}</Text>
                <Text style={styles.resultMeta} numberOfLines={1}>
                  {it.category}
                  {it.manufacturer ? ` · ${it.manufacturer}` : ''}
                  {it.condition_status ? ` · ${tCondition(it.condition_status)}` : ''}
                </Text>
              </View>
              <View style={[styles.qtyBadge, it.quantity <= 10 && styles.qtyBadgeLow]}>
                <Text style={styles.qtyNum}>{it.quantity}</Text>
                <Text style={styles.qtyLabel}>{t('inStock')}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
        {AlertComponent}
      </SafeAreaView>
    );
  }

  if (phase === 'search') {
    return (
      <SafeAreaView style={styles.screen}>
        <Header onBack={() => navBack('/(app)/dashboard')} title={t('useItem')} styles={styles} />
        {barcode && (
          <View style={styles.barcodeBadge}>
            <AppIcon name="barcodeOutline" size={16} />
            <Text style={styles.barcodeText} numberOfLines={1}>{barcode}</Text>
            <View style={styles.notFoundBadge}>
              <Text style={styles.notFoundText}>{t('itemNotFound')}</Text>
            </View>
          </View>
        )}
        <View style={styles.searchWrap}>
          <AppIcon name="search" size={16} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('searchByName')}
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={(v) => { setSearchQuery(v); doSearch(v); }}
            autoFocus
            autoCorrect={false}
          />
          {searching && <ActivityIndicator size="small" color={colors.text} />}
          {!searching && searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchResults([]); }}>
              <AppIcon name="closeCircle" size={16} />
            </TouchableOpacity>
          )}
        </View>
        <FlatList
          data={searchResults}
          keyExtractor={(i) => String(i.id)}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            searchQuery.length > 0 && !searching ? (
              <View style={styles.emptyBox}>
                <AppIcon name="item" size={44} />
                <Text style={styles.emptyText}>{t('noResults')}</Text>
              </View>
            ) : null
          }
          renderItem={({ item: it }) => (
            <TouchableOpacity style={styles.resultCard} onPress={() => selectItem(it)} activeOpacity={0.8}>
              <View style={styles.resultLeft}>
                <Text style={styles.resultName} numberOfLines={1}>{it.name}</Text>
                <Text style={styles.resultMeta}>{it.category} · ¥{Number(it.price).toFixed(2)}</Text>
              </View>
              <View style={[styles.qtyBadge, it.quantity <= 10 && styles.qtyBadgeLow]}>
                <Text style={styles.qtyNum}>{it.quantity}</Text>
                <Text style={styles.qtyLabel}>{t('inStock')}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
        {AlertComponent}
      </SafeAreaView>
    );
  }

  if (phase === 'found') {
    return (
      <SafeAreaView style={styles.screen}>
        <Header onBack={() => navBack('/(app)/dashboard')} title={t('useItem')} styles={styles} />
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <ItemCard item={item} t={t} colors={colors} styles={styles} />
          <View style={styles.qtySection}>
            <Text style={styles.qtySectionLabel}>{t('selectQuantity')}</Text>
            <QuantityControl value={quantity} onChange={setQuantity} min={1} max={item.quantity} />
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <TouchableOpacity style={styles.ctaBtn} onPress={handleConfirm} activeOpacity={0.85} disabled={saving}>
            {saving
              ? <ActivityIndicator color={colors.bg} />
              : <Text style={styles.ctaBtnText}>{t('confirmUse')} ({quantity}{t('pieces')})</Text>}
          </TouchableOpacity>
        </View>
        {AlertComponent}
      </SafeAreaView>
    );
  }

  // confirm phase (from nobarcode or search selection)
  return (
    <SafeAreaView style={styles.screen}>
      <Stack.Screen options={{ gestureEnabled: true, fullScreenGestureEnabled: true }} />
      <Header
        onBack={() => {
          setPhase(isNoBarcode ? 'nobarcode' : 'search');
          setItem(null);
        }}
        title={t('useItem')}
        styles={styles}
      />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {item && <ItemCard item={item} t={t} colors={colors} styles={styles} />}
        <View style={styles.qtySection}>
          <Text style={styles.qtySectionLabel}>{t('selectQuantity')}</Text>
          <QuantityControl value={quantity} onChange={setQuantity} min={1} max={item?.quantity ?? 999} />
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.ctaBtn} onPress={handleConfirm} activeOpacity={0.85} disabled={saving}>
          {saving
            ? <ActivityIndicator color={colors.bg} />
            : <Text style={styles.ctaBtnText}>{t('confirmUse')} ({quantity}{t('pieces')})</Text>}
        </TouchableOpacity>
      </View>
      {AlertComponent}
    </SafeAreaView>
  );
}

function Header({ onBack, title, styles }) {
  const { colors } = useTheme();
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.8}>
        <AppIcon name="back" size={20} />
      </TouchableOpacity>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

function ItemCard({ item, t, colors, styles }) {
  const { tCondition } = useLang();
  const details = [
    ['¥' + Number(item.price).toFixed(2), 'price'],
    [item.expiry_date ? item.expiry_date.slice(0, 10) : '—', 'calendar'],
    [item.manufacturer || '—', 'business-outline'],
    [tCondition(item.condition_status) || '—', 'checkCircleOutline'],
  ];
  return (
    <View style={styles.detailCard}>
      <View style={styles.detailHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.itemCategory}>{item.category}</Text>
          <Text style={styles.itemName}>{item.name}</Text>
          {!item.barcode && (
            <View style={styles.noBarcodePill}>
              <AppIcon name="barcodeOutline" size={11} />
              <Text style={styles.noBarcodePillText}>{t('noBarcode')}</Text>
            </View>
          )}
        </View>
        <View style={[styles.qtyBadge, item.quantity <= 10 && styles.qtyBadgeLow]}>
          <Text style={styles.qtyNum}>{item.quantity}</Text>
          <Text style={styles.qtyLabel}>{t('inStock')}</Text>
        </View>
      </View>
      {details.map(([val, icon]) => val !== '—' ? (
        <View key={icon} style={styles.detailRow}>
          <AppIcon name={icon} size={14} />
          <Text style={styles.detailVal}>{val}</Text>
        </View>
      ) : null)}
    </View>
  );
}

function makeStyles(c) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

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

    noBarcodeHeader: {
      paddingHorizontal: 20, paddingBottom: 8,
    },
    noBarcodeBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: c.surface, borderRadius: 10,
      paddingHorizontal: 12, paddingVertical: 8, alignSelf: 'flex-start',
    },
    noBarcodeLabel: { fontSize: 13, color: c.textMuted, fontWeight: '600' },

    barcodeBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      marginHorizontal: 20, marginBottom: 12,
      backgroundColor: c.surface, borderRadius: 14,
      paddingHorizontal: 14, paddingVertical: 10,
    },
    barcodeText: { fontFamily: 'monospace', fontSize: 13, color: c.textMuted, flex: 1 },
    notFoundBadge: {
      backgroundColor: 'rgba(129,128,126,0.15)', borderRadius: 8,
      paddingHorizontal: 8, paddingVertical: 3,
    },
    notFoundText: { fontSize: 11, color: c.textMuted, fontWeight: '700' },

    searchWrap: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      marginHorizontal: 20, marginBottom: 12,
      backgroundColor: c.surface, borderRadius: 16,
      paddingHorizontal: 14, paddingVertical: 12,
    },
    searchInput: { flex: 1, fontSize: 15, color: c.text },

    listContent: { paddingHorizontal: 20, paddingBottom: 40 },
    resultCard: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: c.surface, borderRadius: 16,
      padding: 14, marginBottom: 10,
    },
    resultLeft: { flex: 1 },
    resultName: { fontSize: 15, fontWeight: '700', color: c.text },
    resultMeta: { fontSize: 12, color: c.textMuted, marginTop: 2 },

    qtyBadge: {
      alignItems: 'center', backgroundColor: c.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
      borderRadius: 10, padding: 8, minWidth: 52,
    },
    qtyBadgeLow: { backgroundColor: 'rgba(129,128,126,0.15)' },
    qtyNum: { fontSize: 18, fontWeight: '800', color: c.text, textAlign: 'center' },
    qtyLabel: { fontSize: 10, color: c.textMuted, textAlign: 'center' },

    emptyBox: { alignItems: 'center', paddingTop: 60, gap: 12 },
    emptyText: { fontSize: 14, color: c.textMuted },

    content: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 20 },

    detailCard: {
      backgroundColor: c.surface, borderRadius: 20,
      padding: 16, marginBottom: 20, gap: 10,
    },
    detailHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 4 },
    itemCategory: { fontSize: 11, color: c.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
    itemName: { fontSize: 18, fontWeight: '800', color: c.text, marginTop: 2 },
    noBarcodePill: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: c.border, borderRadius: 6,
      paddingHorizontal: 7, paddingVertical: 3, alignSelf: 'flex-start', marginTop: 6,
    },
    noBarcodePillText: { fontSize: 11, color: c.textMuted, fontWeight: '500' },
    detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    detailVal: { fontSize: 14, color: c.text, fontWeight: '500' },

    qtySection: { alignItems: 'center', marginTop: 8, gap: 12 },
    qtySectionLabel: { fontSize: 14, color: c.textMuted, fontWeight: '600' },

    footer: {
      paddingHorizontal: 20, paddingBottom: 36, paddingTop: 12,
      borderTopWidth: 1, borderTopColor: c.border,
      backgroundColor: c.bg,
    },
    ctaBtn: {
      backgroundColor: c.text, borderRadius: 20,
      paddingVertical: 18, alignItems: 'center',
    },
    ctaBtnText: { color: c.bg, fontSize: 16, fontWeight: '700' },
  });
}
