import { Image, StyleSheet, View } from "react-native";
import { useTheme } from "@/lib/theme";

const logoDark  = require("@/assets/images/logo.png");
const logoLight = require("@/assets/images/logo-light.png");

export function AppLogo({ size = "large" }) {
  const { colors } = useTheme();
  const dim = size === "large" ? 120 : size === "medium" ? 80 : 48;

  return (
    <View style={styles.wrap}>
      <Image
        source={colors.isDark ? logoDark : logoLight}
        style={{ width: dim, height: dim }}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center" },
});
