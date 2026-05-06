import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  BackHandler,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { navForward, navBack } from "@/lib/animationStore";
import { AppIcon, getIconBoxColor } from "@/components/AppIcons";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useLang } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

export default function AddScanScreen() {
  const { user } = useAuth();
  const { t } = useLang();
  const insets = useSafeAreaInsets();
  const { skipChoice } = useLocalSearchParams();
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const skipChoiceBool = skipChoice === "true";
  const [showChoice, setShowChoice] = useState(false);
  const [scanActive, setScanActive] = useState(skipChoiceBool);
  const [result, setResult] = useState(null); // { barcode, items, isNew }
  const slideAnim = useState(new Animated.Value(-120))[0];
  const sheetAnim = useRef(new Animated.Value(40)).current;
  const sheetOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (showChoice) {
      sheetAnim.setValue(40);
      sheetOpacity.setValue(0);
      Animated.parallel([
        Animated.spring(sheetAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(sheetOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showChoice]);

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        handleBack();
        return true;
      });
      return () => sub.remove();
    }, [showChoice, result]),
  );

  function handleBack() {
    if (showChoice) {
      navBack("/(app)/dashboard");
    } else if (result !== null) {
      hideSheet();
    } else {
      navBack("/(app)/dashboard");
    }
  }

  function handleChoiceBarcode() {
    Animated.parallel([
      Animated.timing(sheetAnim, { toValue: 400, duration: 260, useNativeDriver: true }),
      Animated.timing(sheetOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setShowChoice(false);
      setScanActive(true);
    });
  }

  function handleChoiceManual() {
    navForward("/(app)/add-manual");
  }

  function handleChoiceCancel() {
    navBack("/(app)/dashboard");
  }

  const showSheet = useCallback(
    (data) => {
      setResult(data);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 60,
        friction: 10,
      }).start();
    },
    [slideAnim],
  );

  const hideSheet = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: -120,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setResult(null);
      setScanActive(true);
    });
  }, [slideAnim]);

  const handleScan = useCallback(
    async (barcode) => {
      if (!user) return;
      setScanActive(false);
      try {
        const { exists, items } = await api.checkBarcode(barcode);
        showSheet({ barcode, items, isNew: !exists });
      } catch {
        setScanActive(true);
      }
    },
    [user, showSheet],
  );

  const handleProceed = useCallback(() => {
    if (!result) return;
    if (result.isNew) {
      router.push({
        pathname: "/(app)/add-new-item",
        params: { barcode: result.barcode },
      });
    } else {
      router.push({
        pathname: "/(app)/add-existing",
        params: { barcode: result.barcode },
      });
    }
  }, [result]);

  const item = result?.items?.[0];

  return (
    <View style={styles.screen}>
      <BarcodeScanner
        onScan={handleScan}
        active={scanActive}
        onReady={skipChoiceBool ? undefined : () => setShowChoice(true)}
      />

      {/* Barcode choice overlay */}
      {showChoice && (
        <TouchableOpacity
          style={styles.choiceOverlay}
          activeOpacity={1}
          onPress={handleChoiceCancel}
        >
          <Animated.View style={{ opacity: sheetOpacity, transform: [{ translateY: sheetAnim }] }}>
            <TouchableOpacity
              activeOpacity={1}
              style={[
                styles.modalSheet,
                { paddingBottom: Math.max(insets.bottom + 16 + 82, 122) },
              ]}
            >
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>{t("barcodeChoiceTitle")}</Text>
              <Text style={styles.sheetSubtitle}>
                {t("barcodeChoiceSubtitle")}
              </Text>

              <TouchableOpacity
                style={styles.choiceBtn}
                activeOpacity={0.85}
                onPress={handleChoiceBarcode}
              >
                <View style={[styles.choiceIconWrap, { backgroundColor: getIconBoxColor('barcodeOutline', colors.isDark) }]}>
                  <AppIcon name="barcodeOutline" size={24} />
                </View>
                <View style={styles.choiceText}>
                  <Text style={styles.choiceBtnLabel}>
                    {t("withBarcodeBtn")}
                  </Text>
                  <Text style={styles.choiceBtnSub}>{t("withBarcodeSub")}</Text>
                </View>
                <AppIcon name="forward" size={18} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.choiceBtn, { marginTop: 10 }]}
                activeOpacity={0.85}
                onPress={handleChoiceManual}
              >
                <View style={[styles.choiceIconWrap, { backgroundColor: getIconBoxColor('edit', colors.isDark) }]}>
                  <AppIcon name="edit" size={24} />
                </View>
                <View style={styles.choiceText}>
                  <Text style={styles.choiceBtnLabel}>
                    {t("withoutBarcodeBtn")}
                  </Text>
                  <Text style={styles.choiceBtnSub}>
                    {t("withoutBarcodeSub")}
                  </Text>
                </View>
                <AppIcon name="forward" size={18} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelBtn}
                activeOpacity={0.7}
                onPress={handleChoiceCancel}
              >
                <Text style={styles.cancelBtnText}>{t("cancelLabel")}</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      )}

      {/* Header overlay */}
      <View
        style={[styles.headerWrap, { paddingTop: insets.top + 8 }]}
        pointerEvents="box-none"
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={handleBack}
            activeOpacity={0.8}
          >
            <AppIcon name="back" size={20} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom sheet */}
      {result !== null && (
        <View style={[styles.sheetBg, { paddingTop: insets.top + 64 }]} pointerEvents="box-none">
          <Animated.View
            style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}
          >
            <TouchableOpacity
              style={styles.sheetRow}
              onPress={handleProceed}
              activeOpacity={0.85}
            >
              <View style={[styles.thumb, { backgroundColor: getIconBoxColor(result.isNew ? "addCircleOutline" : "item", colors.isDark) }]}>
                <AppIcon
                  name={result.isNew ? "addCircleOutline" : "item"}
                  size={26}
                />
              </View>
              <View style={{ flex: 1, marginHorizontal: 14 }}>
                <Text style={styles.sheetBrand} numberOfLines={1}>
                  {result.isNew
                    ? t("newItemSheet")
                    : (item?.category ?? t("existingItemSheet"))}
                </Text>
                <Text style={styles.sheetName} numberOfLines={1}>
                  {result.isNew ? result.barcode : item?.name}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.sheetBtn}
                onPress={handleProceed}
                activeOpacity={0.85}
              >
                <AppIcon name="add" size={22} color={colors.bg} />
              </TouchableOpacity>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

function makeStyles(c) {
  return StyleSheet.create({
    screen: { ...StyleSheet.absoluteFillObject, backgroundColor: c.bg },

    headerWrap: { position: "absolute", top: 0, left: 0, right: 0 },
    header: { paddingHorizontal: 20 },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 14,
      backgroundColor: c.surface,
      alignItems: "center",
      justifyContent: "center",
    },

    sheetBg: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      paddingHorizontal: 20,
    },
    sheet: {
      backgroundColor: c.surface,
      borderRadius: 24,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    sheetRow: { flexDirection: "row", alignItems: "center" },
    thumb: {
      width: 52,
      height: 52,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    sheetBrand: {
      fontSize: 12,
      color: c.textMuted,
      fontWeight: "500",
      marginBottom: 3,
    },
    sheetName: { fontSize: 16, fontWeight: "700", color: c.text },
    sheetBtn: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: c.text,
      alignItems: "center",
      justifyContent: "center",
    },

    choiceOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
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
