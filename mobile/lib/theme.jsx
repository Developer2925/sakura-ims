import React, { createContext, useContext, useEffect, useState } from 'react';
import { storage } from './storage';

export const DARK = {
  bg:            '#151515',
  surface:       '#242424',
  surface2:      '#444444',
  text:          '#ffffff',
  textSecondary: '#c0c0c0',
  textMuted:     '#868686',
  border:        'rgba(218,218,218,0.12)',
  border2:       'rgba(218,218,218,0.08)',
  icon:          '#ffffff',
  isDark:        true,
};

export const LIGHT = {
  bg:            '#ffffff',
  surface:       '#efefef',
  surface2:      '#dadada',
  text:          '#151515',
  textSecondary: '#444444',
  textMuted:     '#868686',
  border:        'rgba(36,36,36,0.12)',
  border2:       'rgba(36,36,36,0.08)',
  icon:          '#151515',
  isDark:        false,
};

const ThemeContext = createContext({ colors: DARK, toggleTheme: () => {} });

export function ThemeProvider({ children }) {
  const [colors, setColors] = useState(DARK);

  useEffect(() => {
    storage.get('app_theme').then((val) => {
      if (val === 'light') setColors(LIGHT);
    });
  }, []);

  async function toggleTheme() {
    const next = colors.isDark ? LIGHT : DARK;
    setColors(next);
    await storage.set('app_theme', next.isDark ? 'dark' : 'light');
  }

  return (
    <ThemeContext.Provider value={{ colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
