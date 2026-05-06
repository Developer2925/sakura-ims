import { Stack, router, useSegments } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";
import { getPendingAnimation } from "@/lib/animationStore";
import { triggerTabReload } from "@/lib/tabBarStore";
import { BottomTabBar } from "@/components/BottomTabBar";
import { useAuth } from "@/lib/auth";

// Screens that show the tab bar → map last segment to active tab name
const SEGMENT_TO_TAB = {
  dashboard: "dashboard",
  inventory: "inventory",
  history: "history",
  "add-scan": "add",
  "start-scan": "sell",
  "stocks-received": null,
  "restock-status": null,
};

export default function AppLayout() {
  const { token, loading } = useAuth();
  const segments = useSegments();
  const lastSegment = segments[segments.length - 1] ?? "";
  const showTabBar = lastSegment in SEGMENT_TO_TAB;
  const activeTab = SEGMENT_TO_TAB[lastSegment] ?? null;

  useEffect(() => {
    if (!loading && !token) {
      router.replace("/(auth)/login");
    }
  }, [token, loading]);

  return (
    <View style={{ flex: 1 }}>
      <Stack
        screenOptions={() => ({
          headerShown: false,
          animation: getPendingAnimation(),
          animationDuration: 200,
          gestureEnabled: false,
        })}
      />
      {showTabBar && (
        <BottomTabBar
          active={activeTab}
          onReload={triggerTabReload}
        />
      )}
    </View>
  );
}
