import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import '../global.css';

import { AuthProvider } from '@/lib/auth';
import { LanguageProvider } from '@/lib/i18n';
import { ThemeProvider } from '@/lib/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getPendingAnimation } from '@/lib/animationStore';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider>
    <LanguageProvider>
    <AuthProvider>
      <NavThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={() => ({ headerShown: false, animation: getPendingAnimation() })}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
        </Stack>
        <StatusBar style="auto" />
      </NavThemeProvider>
    </AuthProvider>
    </LanguageProvider>
    </ThemeProvider>
  );
}
