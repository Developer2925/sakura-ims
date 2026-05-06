import { AppIcon } from "@/components/AppIcons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import { useLang } from "@/lib/i18n";

export function BarcodeScanner({ onScan, active = true, onReady }) {
  const { t } = useLang();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (active) setScanned(false);
  }, [active]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [scanLineAnim]);

  function isJAN(data) {
    if (data.length === 13) return data.startsWith('45') || data.startsWith('49');
    if (data.length === 8)  return data.startsWith('04');
    return false;
  }

  function handleBarcode({ data }) {
    if (scanned || !active) return;
    if (!isJAN(data)) return;
    setScanned(true);
    Vibration.vibrate(120);
    setTimeout(() => onScan(data), 200);
  }

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text style={styles.permText}>{t('cameraChecking')}</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permScreen}>
        <View style={styles.permIconWrap}>
          <AppIcon name="camera" size={36} />
        </View>
        <Text style={styles.permTitle}>{t('cameraPermRequired')}</Text>
        <Text style={styles.permSub}>{t('cameraPermDesc')}</Text>
        <TouchableOpacity
          style={styles.permBtn}
          onPress={requestPermission}
          activeOpacity={0.8}
        >
          <Text style={styles.permBtnText}>{t('cameraPermAllow')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const scanLineY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-130, 130],
  });

  return (
    // 'qr', 'ean8', 'code128', 'code39', 'upc_a', 'upc_e', 'itf14', 'datamatrix'
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        onCameraReady={onReady}
        onBarcodeScanned={scanned ? undefined : handleBarcode}
        barcodeScannerSettings={{
          barcodeTypes: ["ean13", "ean8"],
        }}
      />

      {/* Corner brackets only — no dark overlay */}
      <View style={styles.frameWrap}>
        <View style={styles.frame}>
          {/* Corners */}
          <View style={[styles.corner, styles.tl]} />
          <View style={[styles.corner, styles.tr]} />
          <View style={[styles.corner, styles.bl]} />
          <View style={[styles.corner, styles.br]} />

          {/* Scan line */}
          <Animated.View
            style={[
              styles.scanLine,
              { transform: [{ translateY: scanLineY }] },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const CORNER = 28;
const BORDER = 4;
const RADIUS = 10;

const styles = StyleSheet.create({
  container: { flex: 1 },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0F0F0F",
  },
  permText: { color: "#81807E", fontSize: 14 },

  permScreen: {
    flex: 1,
    backgroundColor: "#0F0F0F",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 16,
  },
  permIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: "rgba(59,130,246,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  permTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: -0.3,
  },
  permSub: { fontSize: 14, color: "#81807E", textAlign: "center", lineHeight: 20 },
  permBtn: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 32,
    paddingVertical: 14,
    marginTop: 8,
  },
  permBtnText: { color: "#0F0F0F", fontSize: 15, fontWeight: "700" },

  frameWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  frame: {
    width: 280,
    height: 280,
    alignItems: "center",
    justifyContent: "center",
  },

  corner: {
    position: "absolute",
    width: CORNER,
    height: CORNER,
    borderColor: "#FFFFFF",
  },
  tl: {
    top: 0,
    left: 0,
    borderTopWidth: BORDER,
    borderLeftWidth: BORDER,
    borderTopLeftRadius: RADIUS,
  },
  tr: {
    top: 0,
    right: 0,
    borderTopWidth: BORDER,
    borderRightWidth: BORDER,
    borderTopRightRadius: RADIUS,
  },
  bl: {
    bottom: 0,
    left: 0,
    borderBottomWidth: BORDER,
    borderLeftWidth: BORDER,
    borderBottomLeftRadius: RADIUS,
  },
  br: {
    bottom: 0,
    right: 0,
    borderBottomWidth: BORDER,
    borderRightWidth: BORDER,
    borderBottomRightRadius: RADIUS,
  },

  scanLine: {
    position: "absolute",
    left: 10,
    right: 10,
    height: 2.5,
    backgroundColor: "rgba(255,255,255,0.75)",
    borderRadius: 2,
  },
});
