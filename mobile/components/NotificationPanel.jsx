import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AppIcon, ICONS } from "@/components/AppIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/lib/theme";

const SCREEN_W = Dimensions.get("window").width;
const SWIPE_THRESHOLD = SCREEN_W * 0.35;

const TYPE_CONFIG = {
  approved: { icon: ICONS.checkCircle,  color: "#4ADE80", label: "Approved" },
  rejected: { icon: ICONS.closeCircle,  color: "#F87171", label: "Rejected" },
  shipped:  { icon: ICONS.itemFilled,   color: "#60A5FA", label: "Shipped"  },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function NotificationItem({ n, onDelete, colors, styles, clearAnim }) {
  const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.approved;
  const translateX = useRef(new Animated.Value(0)).current;
  const [expanded, setExpanded] = useState(false);
  const expandAnim = useRef(new Animated.Value(0)).current;

  const clearTranslateX = clearAnim.interpolate({ inputRange: [0, 1], outputRange: [0, SCREEN_W + 60] });
  const clearOpacity = clearAnim.interpolate({ inputRange: [0, 0.4, 1], outputRange: [1, 1, 0] });

  function toggleExpand() {
    const toValue = expanded ? 0 : 1;
    setExpanded(!expanded);
    Animated.spring(expandAnim, { toValue, useNativeDriver: false, tension: 60, friction: 14 }).start();
  }

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dx > 8 && Math.abs(g.dy) < Math.abs(g.dx),
      onPanResponderMove: (_, g) => { if (g.dx > 0) translateX.setValue(g.dx); },
      onPanResponderRelease: (_, g) => {
        if (g.dx > SWIPE_THRESHOLD) {
          Animated.timing(translateX, { toValue: SCREEN_W, duration: 220, useNativeDriver: true })
            .start(() => onDelete(n.id));
        } else {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }).start();
        }
      },
    }),
  ).current;

  const expandedHeight = expandAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 52] });
  const expandedOpacity = expandAnim.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 0, 1] });

  return (
    <Animated.View style={{ transform: [{ translateX: clearTranslateX }], opacity: clearOpacity, marginBottom: 8 }}>
      <Animated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
      <Animated.View style={[styles.capsule, !n.is_read && styles.capsuleUnread]}>
        <TouchableOpacity activeOpacity={0.85} onPress={toggleExpand}>
          {/* Collapsed row */}
          <View style={styles.capsuleRow}>
            <View style={[styles.badge, { backgroundColor: `${cfg.color}1A` }]}>
              <AppIcon name={cfg.icon} size={11} color={cfg.color} />
              <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
            <Text style={styles.msg} numberOfLines={1}>{n.message}</Text>
            <View style={styles.right}>
              <Text style={styles.time}>{timeAgo(n.created_at)}</Text>
              {!n.is_read && <View style={[styles.dot, { backgroundColor: cfg.color }]} />}
              <AppIcon name={expanded ? "chevronUp" : "chevronDown"} size={12} />
            </View>
          </View>

          {/* Expanded detail */}
          <Animated.View style={{ height: expandedHeight, opacity: expandedOpacity }}>
            <View style={[styles.expandDivider, { borderColor: `${cfg.color}22` }]} />
            <Text style={styles.expandMsg}>{n.message}</Text>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}

export function NotificationPanel({ visible, notifications, onClose, onMarkRead, onDelete, onClearAll }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const slideAnim = useRef(new Animated.Value(-400)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const clearAnims = useRef({});

  notifications.forEach((n) => {
    if (!clearAnims.current[n.id]) {
      clearAnims.current[n.id] = new Animated.Value(0);
    }
  });

  function handleClearAll() {
    const anims = notifications.map((n) =>
      Animated.timing(clearAnims.current[n.id], {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    );
    Animated.stagger(40, anims).start(() => {
      clearAnims.current = {};
      onClearAll();
    });
  }

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: -400, duration: 200, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <>
      <Animated.View
        pointerEvents={visible ? "auto" : "none"}
        style={[styles.backdrop, { opacity: opacityAnim }]}
      >
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
      </Animated.View>

      <Animated.View
        pointerEvents={visible ? "auto" : "none"}
        style={[styles.panel, { paddingTop: insets.top + 8, opacity: opacityAnim, transform: [{ translateY: slideAnim }] }]}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Notifications</Text>
          {unreadCount > 0 && (
            <TouchableOpacity style={styles.markReadBtn} onPress={onMarkRead} activeOpacity={0.7}>
              <Text style={styles.markReadText}>Mark all read</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <AppIcon name="close" size={18} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.list, { paddingBottom: 20 }]}
          showsVerticalScrollIndicator={false}
        >
          {notifications.length === 0 ? (
            <View style={styles.emptyBox}>
              <AppIcon name="notifications" size={40} />
              <Text style={styles.emptyText}>No notifications yet</Text>
            </View>
          ) : (
            notifications.map((n) => (
              <NotificationItem
                key={n.id}
                n={n}
                onDelete={onDelete}
                colors={colors}
                styles={styles}
                clearAnim={clearAnims.current[n.id] ?? new Animated.Value(0)}
              />
            ))
          )}
        </ScrollView>

        {notifications.length > 0 && (
          <TouchableOpacity
            style={[styles.clearAllBtn, { paddingBottom: insets.bottom + 16 }]}
            onPress={handleClearAll}
            activeOpacity={0.6}
          >
            <Text style={styles.clearAllText}>Clear all notifications</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </>
  );
}

function makeStyles(c) {
  return StyleSheet.create({
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.5)",
      zIndex: 10,
    },
    panel: {
      position: "absolute",
      top: 0, left: 0, right: 0,
      height: "75%",
      backgroundColor: c.bg,
      borderBottomLeftRadius: 28,
      borderBottomRightRadius: 28,
      borderBottomWidth: 1,
      borderColor: c.border,
      zIndex: 11,
      overflow: "hidden",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    title: { flex: 1, fontSize: 18, fontWeight: "800", color: c.text, letterSpacing: -0.3 },
    markReadBtn: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 10,
      backgroundColor: c.isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
      marginRight: 8,
    },
    markReadText: { fontSize: 12, fontWeight: "600", color: c.textMuted },
    closeBtn: {
      width: 32, height: 32,
      borderRadius: 10,
      backgroundColor: c.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    list: { paddingHorizontal: 16, paddingTop: 12 },

    // Capsule item
    capsule: {
      backgroundColor: c.surface,
      borderRadius: 16,
      paddingVertical: 10,
      paddingHorizontal: 14,
      minHeight: 44,
    },
    capsuleUnread: {
      borderWidth: 1,
      borderColor: c.border2,
    },
    capsuleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    badge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
    },
    badgeText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.2 },
    msg: { flex: 1, fontSize: 12, color: c.textSecondary, letterSpacing: 0.1 },
    right: { flexDirection: "row", alignItems: "center", gap: 5 },
    time: { fontSize: 11, color: c.textMuted },
    dot: { width: 6, height: 6, borderRadius: 3 },
    expandDivider: { borderTopWidth: 1, marginTop: 10, marginBottom: 8 },
    expandMsg: { fontSize: 13, color: c.textSecondary, lineHeight: 18 },

    clearAllBtn: { alignItems: "center", paddingTop: 14 },
    clearAllText: { fontSize: 13, fontWeight: "400", color: c.textMuted, letterSpacing: 0.1 },
    emptyBox: { alignItems: "center", paddingVertical: 60, gap: 12 },
    emptyText: { fontSize: 14, color: c.textMuted },
  });
}
