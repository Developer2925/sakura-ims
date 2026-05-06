import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, TouchableOpacity, View } from "react-native";
import { setPendingAnimation } from "@/lib/animationStore";
import { useTheme } from "@/lib/theme";
import { AppIcon } from "@/components/AppIcons";

const TABS = [
  {
    name: "dashboard",
    icon: "home",
    activeIcon: "homeFilled",
    route: "/(app)/dashboard",
  },
  {
    name: "add",
    icon: "addCircleOutline",
    activeIcon: "addCircle",
    route: "/(app)/add-scan",
  },
  {
    name: "sell",
    icon: "scan",
    activeIcon: "scanFilled",
    route: "/(app)/start-scan",
  },
  {
    name: "inventory",
    icon: "item",
    activeIcon: "itemFilled",
    route: "/(app)/inventory",
  },
  {
    name: "history",
    icon: "time",
    activeIcon: "timeFilled",
    route: "/(app)/history",
  },
];

export function BottomTabBar({ active, onReload }) {
  const { colors } = useTheme();
  const activeIndex = TABS.findIndex((t) => t.name === active);
  const [barWidth, setBarWidth] = useState(0);
  const pillAnim = useRef(new Animated.Value(Math.max(0, activeIndex))).current;

  useEffect(() => {
    if (activeIndex < 0) return;
    Animated.spring(pillAnim, {
      toValue: activeIndex,
      useNativeDriver: true,
      stiffness: 220,
      damping: 24,
      mass: 0.85,
    }).start();
  }, [activeIndex]);

  const tabW = barWidth > 0 ? (barWidth - 12) / TABS.length : 0;
  const pillLeft = tabW > 0 ? 6 + tabW / 2 - 23 : 0;

  const pillTranslateX = pillAnim.interpolate({
    inputRange: TABS.map((_, i) => i),
    outputRange: TABS.map((_, i) => i * tabW),
    extrapolate: "clamp",
  });

  const barBg = colors.isDark ? "#FFFFFF" : "#1C1C1C";
  // const barBorder = colors.isDark
  //   ? "rgba(58, 58, 58, 0.96)"
  //   : "rgba(226, 226, 226, 0.96)";
  const pillBg = colors.isDark ? "#1C1C1C" : "#FFFFFF";

  const tabColor = colors.isDark ? "#1C1C1C" : "#FFFFFF";

  return (
    <View style={styles.wrap}>
      <View
        style={[styles.bar, { backgroundColor: barBg }]}
        onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
      >
        {barWidth > 0 && activeIndex >= 0 && (
          <Animated.View
            style={[
              styles.pill,
              {
                left: pillLeft,
                backgroundColor: pillBg,
                transform: [{ translateX: pillTranslateX }],
              },
            ]}
          />
        )}

        {TABS.map((tab, targetIndex) => {
          const isActive = active === tab.name;
          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tab}
              onPress={() => {
                if (isActive) {
                  onReload?.();
                } else if (targetIndex > activeIndex) {
                  setPendingAnimation("slide_from_right");
                  router.push(tab.route);
                } else {
                  setPendingAnimation("slide_from_left");
                  router.push(tab.route);
                }
              }}
              activeOpacity={0.7}
            >
              <View style={styles.iconWrap}>
                <AppIcon
                  name={isActive ? tab.activeIcon : tab.icon}
                  size={22}
                  color={
                    isActive
                      ? colors.isDark
                        ? "#FFFFFF"
                        : "#1C1C1C"
                      : tabColor
                  }
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  bar: {
    flexDirection: "row",
    borderRadius: 32,
    paddingVertical: 8,
    paddingHorizontal: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 12,
    alignItems: "center",
    justifyContent: "space-around",
  },
  pill: {
    position: "absolute",
    top: 8,
    width: 46,
    height: 46,
    borderRadius: "100%",
  },
  tab: { flex: 1, alignItems: "center", justifyContent: "center", zIndex: 1 },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
});
