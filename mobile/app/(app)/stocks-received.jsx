import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { navBack } from '@/lib/animationStore';
import { AppIcon, getIconBoxColor } from '@/components/AppIcons';
import { api } from '@/lib/api';
import { useLang } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';

function ReceivedCard({ req, colors, styles }) {
  const { t } = useLang();
  const deliveredDate = req.delivered_at
    ? new Date(req.delivered_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : '—';
  const requestedDate = new Date(req.requested_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconBox, { backgroundColor: getIconBoxColor('itemFilled', colors.isDark) }]}>
          <AppIcon name="itemFilled" size={22} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardName} numberOfLines={1}>{req.item_name}</Text>
          <Text style={styles.cardCategory}>{req.category}</Text>
        </View>
        <View style={styles.qtyBadge}>
          <Text style={styles.qtyNum}>+{req.requested_quantity}</Text>
          <Text style={styles.qtyLabel}>{t('receivedLabel')}</Text>
        </View>
      </View>

      <View style={styles.cardDates}>
        <View style={styles.dateItem}>
          <Text style={styles.dateLabel}>{t('requestedLabel')}</Text>
          <Text style={styles.dateValue}>{requestedDate}</Text>
        </View>
        <AppIcon name="arrowRight" size={14} />
        <View style={styles.dateItem}>
          <Text style={styles.dateLabel}>{t('deliveredLabel')}</Text>
          <Text style={styles.dateValue}>{deliveredDate}</Text>
        </View>
      </View>

      {req.admin_note && (
        <View style={styles.noteRow}>
          <AppIcon name="person" size={12} />
          <Text style={styles.noteText} numberOfLines={2}>{req.admin_note}</Text>
        </View>
      )}
    </View>
  );
}

export default function StocksReceivedScreen() {
  const { t } = useLang();
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getRestockRequests()
      .then(({ requests }) => setItems(requests.filter((r) => r.status === 'delivered')))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        navBack('/(app)/dashboard');
        return true;
      });
      return () => sub.remove();
    }, []),
  );

  const totalReceived = items.reduce((s, r) => s + r.requested_quantity, 0);

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
        <Text style={styles.title}>{t('stocksReceived')}</Text>
      </View>

      {!loading && items.length > 0 && (
        <View style={styles.summaryBar}>
          <AppIcon name="checkDone" size={16} />
          <Text style={styles.summaryText}>
            {t('totalReceivedSummary')}{' '}
            <Text style={{ fontWeight: '800', color: colors.text }}>{totalReceived}</Text>
            {' '}{t('totalReceivedSuffix')}
          </Text>
        </View>
      )}

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.text} /></View>
      ) : items.length === 0 ? (
        <View style={styles.emptyBox}>
          <AppIcon name="archiveOutline" size={52} />
          <Text style={styles.emptyText}>{t('noReceivedItems')}</Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        >
          {items.map((req) => <ReceivedCard key={req.id} req={req} colors={colors} styles={styles} />)}
          <View style={{ height: 110 }} />
        </ScrollView>
      )}

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
    summaryBar: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      marginHorizontal: 20, marginBottom: 12,
      backgroundColor: c.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', borderRadius: 14,
      paddingHorizontal: 14, paddingVertical: 10,
    },
    summaryText: { fontSize: 14, color: c.text, fontWeight: '600' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    emptyText: { fontSize: 14, color: c.textMuted },
    listContent: { paddingHorizontal: 20, paddingTop: 4 },
    card: {
      backgroundColor: c.surface, borderRadius: 18, padding: 14, marginBottom: 12, gap: 10,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconBox: {
      width: 46, height: 46, borderRadius: 14,
      alignItems: 'center', justifyContent: 'center',
    },
    cardName: { fontSize: 15, fontWeight: '700', color: c.text },
    cardCategory: { fontSize: 12, color: c.textMuted, marginTop: 2 },
    qtyBadge: { alignItems: 'flex-end' },
    qtyNum: { fontSize: 18, fontWeight: '800', color: c.text },
    qtyLabel: { fontSize: 10, color: c.textMuted },
    cardDates: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    dateItem: { flex: 1 },
    dateLabel: { fontSize: 11, color: c.textMuted, fontWeight: '600' },
    dateValue: { fontSize: 13, fontWeight: '700', color: c.text, marginTop: 2 },
    noteRow: {
      flexDirection: 'row', alignItems: 'flex-start', gap: 6,
      backgroundColor: c.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8,
    },
    noteText: { fontSize: 12, color: c.text, flex: 1 },
  });
}
