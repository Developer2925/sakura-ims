import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from "react";
import {
  Animated,
  RefreshControl,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
  BackHandler,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { navForward, navBack } from "@/lib/animationStore";
import { useFocusEffect } from "@react-navigation/native";
import { AppIcon, ICONS, ICON_SIZES, getIconBoxColor } from "@/components/AppIcons";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useLang } from "@/lib/i18n";
import { registerTabReload } from "@/lib/tabBarStore";
import { InventorySkeleton } from "@/components/Skeleton";
import { useTheme } from "@/lib/theme";

const LOW_STOCK = 100; // Threshold for low stock items

function getCatColor(cat, isDark) {
  const bg = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const fg = "#81807E";
  return { bg, fg };
}

function formatExpiry(dateStr) {
  if (!dateStr) return null;
  return String(dateStr).split("T")[0];
}

function BatchRow({ batch, isLast, colors }) {
  const { tCondition } = useLang();
  const expiry = formatExpiry(batch.expiry_date);
  const batchStyles = useMemo(() => makeBatchStyles(colors), [colors]);
  return (
    <View style={[batchStyles.row, !isLast && batchStyles.rowBorder]}>
      <View style={batchStyles.left}>
        <View style={batchStyles.priceChip}>
          <AppIcon
            name="price"
            size={11}
          />
          <Text style={batchStyles.price}>
            ¥{Number(batch.price).toFixed(2)}
          </Text>
        </View>
        {expiry ? (
          <View style={batchStyles.expiryChip}>
            <AppIcon
              name="calendar"
              size={11}
            />
            <Text style={batchStyles.expiry}>{expiry}</Text>
          </View>
        ) : null}
        {batch.condition_status ? (
          <View style={batchStyles.expiryChip}>
            <AppIcon
              name="checkCircleOutline"
              size={11}
            />
            <Text style={batchStyles.expiry}>
              {tCondition(batch.condition_status)}
            </Text>
          </View>
        ) : null}
      </View>
      <View style={batchStyles.qtyBox}>
        <Text style={batchStyles.qty}>{batch.quantity}</Text>
        <Text style={batchStyles.qtyLabel}>pcs</Text>
      </View>
    </View>
  );
}

function ItemDetailContent({
  item,
  t,
  onClose,
  onAddStock,
  onRestock,
  colors,
}) {
  const { tCondition } = useLang();
  const batches = item.batches || [];
  const idLabel = item.barcode ? t("barcodeLabel") : t("internalIdLabel");
  const idValue = item.barcode || item.internal_id || "—";
  const detailStyles = useMemo(() => makeDetailStyles(colors), [colors]);

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      style={{ maxHeight: "90%" }}
    >
      {/* Item image */}
      {item.image_data ? (
        <Image
          source={{ uri: `data:image/jpeg;base64,${item.image_data}` }}
          style={detailStyles.itemImage}
          resizeMode="cover"
        />
      ) : null}

      {/* Header */}
      <View style={detailStyles.header}>
        <View style={{ flex: 1 }}>
          <Text style={detailStyles.category}>{item.category}</Text>
          <Text style={detailStyles.name}>{item.name}</Text>
        </View>
        <TouchableOpacity
          style={detailStyles.closeBtn}
          onPress={onClose}
          activeOpacity={0.8}
        >
          <AppIcon name="close" size={18} />
        </TouchableOpacity>
      </View>

      {/* ID row */}
      <View style={detailStyles.idRow}>
        <AppIcon
          name={item.barcode ? "barcodeOutline" : "fingerprint"}
          size={14}
        />
        <Text style={detailStyles.idLabel}>{idLabel}</Text>
        <Text style={detailStyles.idValue} selectable>
          {idValue}
        </Text>
      </View>

      {/* Meta chips */}
      <View style={detailStyles.metaRow}>
        {item.manufacturer ? (
          <View style={detailStyles.metaChip}>
            <AppIcon
              name="business"
              size={12}
            />
            <Text style={detailStyles.metaChipText}>{item.manufacturer}</Text>
          </View>
        ) : null}
        {item.condition_status ? (
          <View style={detailStyles.metaChip}>
            <AppIcon
              name="checkCircleOutline"
              size={12}
            />
            <Text style={detailStyles.metaChipText}>
              {tCondition(item.condition_status)}
            </Text>
          </View>
        ) : null}
        <View
          style={[
            detailStyles.metaChip,
            item.quantity <= LOW_STOCK && detailStyles.metaChipLow,
          ]}
        >
          <AppIcon name="item" size={12} />
          <Text style={detailStyles.metaChipText}>
            {item.quantity} {t("inStock")}
          </Text>
        </View>
      </View>

      {/* Batches */}
      <Text style={detailStyles.sectionTitle}>
        {batches.length} {t("batchCount")} · ¥
        {Number(item.total_price ?? 0).toFixed(2)} {t("totalPriceLabel")}
      </Text>
      {batches.length > 0 ? (
        <View style={detailStyles.batchList}>
          {batches.map((batch, idx) => {
            const expiry = batch.expiry_date
              ? String(batch.expiry_date).split("T")[0]
              : null;
            return (
              <View
                key={batch.id}
                style={[
                  detailStyles.batchRow,
                  idx < batches.length - 1 && detailStyles.batchRowBorder,
                ]}
              >
                <View style={{ flex: 1, gap: 4 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <AppIcon
                      name="price"
                      size={12}
                    />
                    <Text style={detailStyles.batchPrice}>
                      ¥{Number(batch.price).toFixed(2)}
                    </Text>
                  </View>
                  {expiry ? (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      <AppIcon
                        name="calendar"
                        size={12}
                      />
                      <Text style={detailStyles.batchExpiry}>{expiry}</Text>
                    </View>
                  ) : null}
                  {batch.condition_status ? (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      <AppIcon
                        name="checkCircleOutline"
                        size={12}
                      />
                      <Text style={detailStyles.batchExpiry}>
                        {tCondition(batch.condition_status)}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <View style={detailStyles.batchQtyBox}>
                  <Text style={detailStyles.batchQty}>{batch.quantity}</Text>
                  <Text style={detailStyles.batchQtyLabel}>pcs</Text>
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={detailStyles.noBatches}>
          <AppIcon name="batches" size={28} />
          <Text style={detailStyles.noBatchesText}>{t("noBatchesYet")}</Text>
        </View>
      )}

      {/* Action buttons */}
      <View style={detailStyles.actionRow}>
        <TouchableOpacity
          style={detailStyles.actionBtnSecondary}
          onPress={() => {
            onClose();
            onRestock(item);
          }}
          activeOpacity={0.85}
        >
          <AppIcon
            name="arrowUp"
            size={16}
          />
          <Text style={detailStyles.actionBtnSecondaryText}>
            {t("restockRequest")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={detailStyles.actionBtnPrimary}
          onPress={() => {
            onClose();
            onAddStock(item);
          }}
          activeOpacity={0.85}
        >
          <AppIcon name="addCircleOutline" size={16} color={colors.bg} />
          <Text style={detailStyles.actionBtnPrimaryText}>{t("addStock")}</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 8 }} />
    </ScrollView>
  );
}

function ItemCard({ item, onRestock, onAddStock, onPress, t, colors, styles }) {
  const { tCondition } = useLang();
  const col = getCatColor(item.category, colors.isDark);
  const initial = item.name?.[0]?.toUpperCase() ?? "?";
  const isLow = item.quantity <= LOW_STOCK;

  const batches = item.batches || [];

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {item.image_data ? (
          <Image
            source={{ uri: `data:image/jpeg;base64,${item.image_data}` }}
            style={styles.thumb}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.thumb, { backgroundColor: col.bg }]}>
            <Text style={[styles.thumbText, { color: col.fg }]}>{initial}</Text>
          </View>
        )}
        <View style={styles.cardInfo}>
          <Text style={styles.cardCategory} numberOfLines={1}>
            {item.category}
          </Text>
          <View style={styles.nameRow}>
            <Text style={styles.cardName} numberOfLines={1}>
              {item.name}
            </Text>
            {isLow && (
              <View style={styles.lowBadge}>
                <AppIcon name="warning" size={10} />
                <Text style={styles.lowText}>{t("low")}</Text>
              </View>
            )}
          </View>
          <View style={styles.metaRow}>
            {item.manufacturer ? (
              <View style={styles.metaChip}>
                <AppIcon
                  name="business"
                  size={10}
                />
                <Text style={styles.metaChipText} numberOfLines={1}>
                  {item.manufacturer}
                </Text>
              </View>
            ) : null}
            {item.condition_status ? (
              <View style={styles.metaChip}>
                <AppIcon
                  name="checkCircleOutline"
                  size={10}
                />
                <Text style={styles.metaChipText} numberOfLines={1}>
                  {tCondition(item.condition_status)}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
        <View style={styles.qtyBadge}>
          <Text style={[styles.qtyNum, isLow && { color: colors.textMuted }]}>
            {item.quantity}
          </Text>
          <Text style={styles.qtyLabel}>{t("inStock")}</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.cardFooter}>
        {/* Batch section header */}
        <View style={styles.batchSectionHeader}>
          <AppIcon name="batches" size={13} />
          <Text style={styles.batchSectionTitle}>
            {batches.length} {t("batchCount")}
          </Text>
          <Text style={styles.batchSectionTotal}>
            · ¥{Number(item.total_price ?? 0).toFixed(2)} {t("totalPriceLabel")}
          </Text>
        </View>

        {/* Batch rows — always visible */}
        {batches.length > 0 ? (
          <View style={styles.batchList}>
            {batches.map((batch, idx) => (
              <BatchRow
                key={batch.id}
                batch={batch}
                isLast={idx === batches.length - 1}
                colors={colors}
              />
            ))}
          </View>
        ) : (
          /* Fallback when migration hasn't run yet */
          <View style={styles.priceRow}>
            <AppIcon
              name="price"
              size={13}
            />
            <Text style={styles.unitPrice}>
              ¥{Number(item.price).toFixed(2)} / {t("pieces")}
            </Text>
            {item.expiry_date && (
              <>
                <Text style={styles.separator}>·</Text>
                <AppIcon
                  name="calendar"
                  size={12}
                />
                <Text style={styles.expiryText}>
                  {formatExpiry(item.expiry_date)}
                </Text>
              </>
            )}
          </View>
        )}

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.addStockBtn}
            onPress={() => onAddStock(item)}
            activeOpacity={0.8}
          >
            <AppIcon
              name="addCircleOutline"
              size={15}
            />
            <Text style={styles.addStockBtnText}>{t("addStock")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.restockBtn}
            onPress={() => onRestock(item)}
            activeOpacity={0.8}
          >
            <AppIcon
              name="arrowUp"
              size={15}
            />
            <Text style={styles.restockBtnText}>{t("restockRequest")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function InventoryScreen() {
  const { user } = useAuth();
  const { t } = useLang();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showBarcodeChoice, setShowBarcodeChoice] = useState(false);
  const [detailItem, setDetailItem] = useState(null);

  const sheetAnim = useRef(new Animated.Value(500)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (showBarcodeChoice) {
      sheetAnim.setValue(500);
      overlayAnim.setValue(0);
      Animated.parallel([
        Animated.spring(sheetAnim, {
          toValue: 0,
          useNativeDriver: true,
          stiffness: 280,
          damping: 28,
          mass: 0.85,
        }),
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showBarcodeChoice]);

  const closeChoiceModal = useCallback(() => {
    Animated.parallel([
      Animated.timing(sheetAnim, {
        toValue: 500,
        duration: 240,
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => setShowBarcodeChoice(false));
  }, [sheetAnim, overlayAnim]);

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        navBack("/(app)/dashboard");
        return true;
      });
      return () => sub.remove();
    }, []),
  );

  async function loadItems() {
    if (!user) return;
    try {
      const { items: data } = await api.getInventory();
      setItems(data);
    } catch (err) {
      console.error("Failed to load inventory:", err);
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [user]),
  );

  useFocusEffect(
    useCallback(() => {
      registerTabReload(() => {
        setLoading(true);
        loadItems();
      });
    }, []),
  );

  useEffect(() => {
    loadItems();
  }, [user]);

  const handleRestock = useCallback((item) => {
    navForward("/(app)/restock-request", {
      itemId: item.id,
      itemName: item.name,
    });
  }, []);

  const handleAddStock = useCallback((item) => {
    navForward("/(app)/add-stock", {
      itemId: item.id,
      itemName: item.name,
      currentQty: item.quantity,
      price: item.price,
      category: item.category,
      conditionStatus: item.condition_status,
    });
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q),
    );
  }, [items, search]);

  const totalValue = useMemo(
    () =>
      items.reduce(
        (s, i) => s + Number(i.total_price ?? Number(i.price) * i.quantity),
        0,
      ),
    [items],
  );

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navBack("/(app)/dashboard")}
          activeOpacity={0.8}
        >
          <AppIcon name="back" size={20} />
        </TouchableOpacity>
        <Text style={styles.title}>{t("inventory")}</Text>
      </View>

      <View style={styles.searchWrap}>
        <AppIcon
          name="search"
          size={16}
          style={{ marginRight: 8 }}
        />
        <TextInput
          style={styles.searchInput}
          placeholder={t("searchPlaceholder")}
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")} activeOpacity={0.7}>
            <AppIcon name="closeCircle" size={16} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <InventorySkeleton />
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => {
                setLoading(true);
                loadItems();
              }}
            />
          }
        >
          {filtered.length === 0 ? (
            <View style={styles.emptyBox}>
              <AppIcon
                name="item"
                size={52}
              />
              <Text style={styles.emptyText}>
                {search ? t("noSearchResults") : t("noInventory")}
              </Text>
            </View>
          ) : (
            filtered.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onRestock={handleRestock}
                onAddStock={handleAddStock}
                onPress={() => setDetailItem(item)}
                t={t}
                colors={colors}
                styles={styles}
              />
            ))
          )}
          <View style={{ height: 16 }} />
        </ScrollView>
      )}

      {!loading && (
        <View style={styles.footer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t("totalValue")}</Text>
            <Text style={styles.totalValue}>¥{totalValue.toFixed(2)}</Text>
          </View>
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={() => setShowBarcodeChoice(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaBtnText}>{t("addItem")}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Item Detail Modal */}
      <Modal
        visible={!!detailItem}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailItem(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: 40 }]}>
            <View style={styles.sheetHandle} />

            {detailItem && (
              <ItemDetailContent
                item={detailItem}
                t={t}
                onClose={() => setDetailItem(null)}
                onAddStock={handleAddStock}
                onRestock={handleRestock}
                colors={colors}
              />
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={showBarcodeChoice}
        transparent
        animationType="none"
        onRequestClose={closeChoiceModal}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeChoiceModal}
        >
          <Animated.View
            style={[
              styles.modalSheet,
              { transform: [{ translateY: sheetAnim }] },
            ]}
          >
            <TouchableOpacity activeOpacity={1}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>{t("barcodeChoiceTitle")}</Text>
              <Text style={styles.sheetSubtitle}>
                {t("barcodeChoiceSubtitle")}
              </Text>

              <TouchableOpacity
                style={styles.choiceBtn}
                activeOpacity={0.85}
                onPress={() => {
                  Animated.parallel([
                    Animated.timing(sheetAnim, {
                      toValue: 500,
                      duration: 260,
                      useNativeDriver: true,
                    }),
                    Animated.timing(overlayAnim, {
                      toValue: 0,
                      duration: 200,
                      useNativeDriver: true,
                    }),
                  ]).start(() => {
                    setShowBarcodeChoice(false);
                    navForward("/(app)/add-scan", { skipChoice: "true" });
                  });
                }}
              >
                <View style={[styles.choiceIconWrap, { backgroundColor: getIconBoxColor('barcodeOutline', colors.isDark) }]}>
                  <AppIcon
                    name="barcodeOutline"
                    size={24}
                  />
                </View>
                <View style={styles.choiceText}>
                  <Text style={styles.choiceBtnLabel}>
                    {t("withBarcodeBtn")}
                  </Text>
                  <Text style={styles.choiceBtnSub}>{t("withBarcodeSub")}</Text>
                </View>
                <AppIcon
                  name="forward"
                  size={18}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.choiceBtn, { marginTop: 10 }]}
                activeOpacity={0.85}
                onPress={() => {
                  setShowBarcodeChoice(false);
                  navForward("/(app)/add-manual");
                }}
              >
                <View style={[styles.choiceIconWrap, { backgroundColor: getIconBoxColor('edit', colors.isDark) }]}>
                  <AppIcon
                    name="edit"
                    size={24}
                  />
                </View>
                <View style={styles.choiceText}>
                  <Text style={styles.choiceBtnLabel}>
                    {t("withoutBarcodeBtn")}
                  </Text>
                  <Text style={styles.choiceBtnSub}>
                    {t("withoutBarcodeSub")}
                  </Text>
                </View>
                <AppIcon
                  name="forward"
                  size={18}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelBtn}
                activeOpacity={0.7}
                onPress={closeChoiceModal}
              >
                <Text style={styles.cancelBtnText}>{t("cancelLabel")}</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

function makeBatchStyles(c) {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 8,
      paddingHorizontal: 2,
    },
    rowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    left: { flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 6 },
    priceChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: c.isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    price: { fontSize: 12, fontWeight: "700", color: c.textMuted },
    expiryChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: c.isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    expiry: { fontSize: 12, fontWeight: "600", color: c.textMuted },
    qtyBox: { alignItems: "center", minWidth: 36 },
    qty: { fontSize: 15, fontWeight: "800", color: c.text },
    qtyLabel: { fontSize: 9, color: c.textMuted },
  });
}

function makeStyles(c) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 14,
      gap: 14,
      backgroundColor: c.bg,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 14,
      backgroundColor: c.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      fontSize: 22,
      fontWeight: "800",
      color: c.text,
      letterSpacing: -0.3,
    },
    searchWrap: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: 20,
      marginBottom: 12,
      paddingHorizontal: 14,
      paddingVertical: 11,
      backgroundColor: c.surface,
      borderRadius: 16,
    },
    searchInput: { flex: 1, fontSize: 14, color: c.text },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    listContent: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 8 },
    card: {
      backgroundColor: c.surface,
      borderRadius: 20,
      marginBottom: 14,
      overflow: "hidden",
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      padding: 14,
      gap: 12,
    },
    thumb: {
      width: 48,
      height: 48,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    thumbText: { fontSize: 20, fontWeight: "800" },
    cardInfo: { flex: 1 },
    cardCategory: {
      fontSize: 11,
      color: c.textMuted,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.3,
    },
    nameRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 2,
    },
    cardName: {
      fontSize: 15,
      fontWeight: "700",
      color: c.text,
      flexShrink: 1,
    },
    lowBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      backgroundColor: "rgba(129,128,126,0.2)",
      borderRadius: 6,
      paddingHorizontal: 5,
      paddingVertical: 2,
    },
    lowText: { fontSize: 10, color: c.textMuted, fontWeight: "700" },
    qtyBadge: { alignItems: "center" },
    qtyNum: { fontSize: 20, fontWeight: "800", color: c.text },
    qtyLabel: { fontSize: 10, color: c.textMuted, fontWeight: "500" },
    cardFooter: {
      backgroundColor: c.bg,
      borderTopWidth: 1,
      borderTopColor: c.border,
      paddingHorizontal: 14,
      paddingVertical: 12,
      gap: 8,
    },
    priceRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    unitPrice: { fontSize: 13, color: c.textMuted, fontWeight: "500" },
    separator: { color: c.textMuted },
    expiryText: { fontSize: 12, color: c.textMuted },

    batchSectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      marginBottom: 4,
    },
    batchSectionTitle: { fontSize: 12, fontWeight: "700", color: c.textMuted },
    batchSectionTotal: { fontSize: 12, color: c.textMuted, fontWeight: "500" },
    batchList: {
      backgroundColor: c.isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 2,
    },

    actionRow: { flexDirection: "row", gap: 8, marginTop: 4 },
    addStockBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: c.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 7,
      flex: 1,
      justifyContent: "center",
    },
    addStockBtnText: { fontSize: 13, color: c.textMuted, fontWeight: "600" },
    restockBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: c.border2,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 7,
      flex: 1,
      justifyContent: "center",
    },
    restockBtnText: { fontSize: 13, color: c.text, fontWeight: "600" },
    emptyBox: { alignItems: "center", paddingTop: 80, gap: 12 },
    emptyText: { fontSize: 14, color: c.textMuted, textAlign: "center" },
    footer: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 110,
      borderTopWidth: 1,
      borderTopColor: c.border,
      backgroundColor: c.bg,
    },
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    totalLabel: { fontSize: 18, fontWeight: "700", color: c.textMuted },
    totalValue: { fontSize: 20, fontWeight: "800", color: c.text },
    ctaBtn: {
      backgroundColor: c.text,
      borderRadius: 20,
      paddingVertical: 18,
      alignItems: "center",
    },
    ctaBtnText: { color: c.bg, fontSize: 16, fontWeight: "700" },

    metaRow: { flexDirection: "row", gap: 6, marginTop: 5, flexWrap: "wrap" },
    metaChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: c.isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
      borderRadius: 6,
      paddingHorizontal: 6,
      paddingVertical: 3,
    },
    metaChipText: { fontSize: 11, color: c.textMuted, fontWeight: "500" },

    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "flex-end",
    },
    modalSheet: {
      backgroundColor: c.surface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: 20,
      paddingTop: 14,
      paddingBottom: 40,
    },
    sheetHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: "rgba(129,128,126,0.4)",
      alignSelf: "center",
      marginBottom: 20,
    },
    sheetTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: c.text,
      marginBottom: 6,
    },
    sheetSubtitle: { fontSize: 13, color: c.textMuted, marginBottom: 24 },
    choiceBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      backgroundColor: c.bg,
      borderRadius: 16,
      padding: 16,
    },
    choiceIconWrap: {
      width: 48,
      height: 48,
      borderRadius: 14,
      backgroundColor: c.isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
      alignItems: "center",
      justifyContent: "center",
    },
    choiceText: { flex: 1 },
    choiceBtnLabel: {
      fontSize: 15,
      fontWeight: "700",
      color: c.text,
      marginBottom: 3,
    },
    choiceBtnSub: { fontSize: 12, color: c.textMuted },
    cancelBtn: {
      marginTop: 16,
      paddingVertical: 16,
      alignItems: "center",
      backgroundColor: "rgba(129,128,126,0.1)",
      borderRadius: 16,
    },
    cancelBtnText: { fontSize: 15, fontWeight: "600", color: c.textMuted },
  });
}

function makeDetailStyles(c) {
  return StyleSheet.create({
    itemImage: {
      width: "100%",
      height: 180,
      borderRadius: 14,
      marginBottom: 16,
      backgroundColor: c.surface,
    },
    header: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      marginBottom: 14,
    },
    category: {
      fontSize: 11,
      color: c.textMuted,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.4,
      marginBottom: 4,
    },
    name: { fontSize: 20, fontWeight: "800", color: c.text, lineHeight: 26 },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: c.border,
      alignItems: "center",
      justifyContent: "center",
    },
    idRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: c.isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginBottom: 12,
    },
    idLabel: { fontSize: 12, color: c.textMuted, fontWeight: "600" },
    idValue: {
      flex: 1,
      fontSize: 13,
      color: c.text,
      fontFamily: "monospace",
      textAlign: "right",
    },
    metaRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 20,
    },
    metaChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      backgroundColor: c.isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    metaChipLow: { backgroundColor: "rgba(129,128,126,0.15)" },
    metaChipText: { fontSize: 12, color: c.textMuted, fontWeight: "500" },
    sectionTitle: {
      fontSize: 12,
      fontWeight: "700",
      color: c.textMuted,
      marginBottom: 10,
      textTransform: "uppercase",
      letterSpacing: 0.3,
    },
    batchList: {
      backgroundColor: c.isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 4,
      marginBottom: 8,
    },
    batchRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      gap: 12,
    },
    batchRowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    batchPrice: { fontSize: 14, fontWeight: "700", color: c.text },
    batchExpiry: { fontSize: 12, color: c.textMuted },
    batchQtyBox: { alignItems: "center", minWidth: 42 },
    batchQty: { fontSize: 18, fontWeight: "800", color: c.text },
    batchQtyLabel: { fontSize: 9, color: c.textMuted },
    noBatches: { alignItems: "center", paddingVertical: 24, gap: 8 },
    noBatchesText: { fontSize: 13, color: c.textMuted },
    actionRow: {
      flexDirection: "row",
      gap: 10,
      marginTop: 16,
    },
    actionBtnPrimary: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      backgroundColor: c.text,
      borderRadius: 14,
      paddingVertical: 13,
    },
    actionBtnPrimaryText: { fontSize: 14, fontWeight: "700", color: c.bg },
    actionBtnSecondary: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      backgroundColor: c.border,
      borderRadius: 14,
      paddingVertical: 13,
    },
    actionBtnSecondaryText: {
      fontSize: 14,
      fontWeight: "600",
      color: c.textMuted,
    },
  });
}
