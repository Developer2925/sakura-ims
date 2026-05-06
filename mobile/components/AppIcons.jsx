import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/lib/theme";

// Semantic name → Ionicons icon name
export const ICONS = {
  // ── Navigation ──────────────────────────────────────
  back: "chevron-back",
  forward: "chevron-forward",
  chevronDown: "chevron-down",
  chevronUp: "chevron-up",
  arrowRight: "arrow-forward",
  arrowRightOutline: "arrow-forward-outline",
  arrowUp: "arrow-up-circle-outline",

  // ── Actions ──────────────────────────────────────────
  add: "add",
  addCircle: "add-circle",
  addCircleOutline: "add-circle-outline",
  close: "close",
  closeCircle: "close-circle",
  remove: "remove",
  removeCircle: "remove-circle",
  refresh: "refresh",
  send: "paper-plane-outline",
  edit: "pencil-outline",
  logout: "log-out-outline",

  // ── Inventory ────────────────────────────────────────
  item: "cube-outline",
  itemFilled: "cube",
  batches: "layers-outline",
  barcode: "barcode",
  barcodeOutline: "barcode-outline",
  archive: "archive",
  archiveOutline: "archive-outline",
  price: "pricetag-outline",
  fingerprint: "finger-print-outline",

  // ── Status ───────────────────────────────────────────
  checkCircle: "checkmark-circle",
  checkCircleOutline: "checkmark-circle-outline",
  checkDone: "checkmark-done-circle-outline",
  warning: "warning",
  info: "information-circle-outline",
  help: "help-circle-outline",

  // ── UI / misc ────────────────────────────────────────
  search: "search-outline",
  list: "list-outline",
  calendar: "calendar-outline",
  time: "time-outline",
  camera: "camera-outline",
  car: "car-outline",
  restock: "clipboard-outline",
  cash: "cash-outline",
  chat: "chatbubble-outline",
  person: "person-outline",
  notifications: "notifications",
  language: "language-outline",
  settings: "settings-outline",
  toggles: "options-outline",
  business: "business-outline",
  home: "home-outline",
  homeFilled: "home",
  scan: "scan-outline",
  scanFilled: "scan",
  timeFilled: "time",
  moon: "moon-outline",
  sun: "sunny-outline",
};

// Semantic color tokens (kept for explicit overrides in screens)
export const ICON_COLORS = {
  default: "#81807E",
  danger: "#E8909D",
  blue: "#1D6FA4",
  teal: "#8EC8FF",
  green: "#4ADE80",
  red: "#F87171",
  confirm: "#0F0F0F",
};

// Per-icon default colors — DARK theme (vibrant on #151515)
const DARK_COLORS = {
  // Navigation
  back: "#8EC8FF",
  forward: "#8EC8FF",
  chevronDown: "#8EC8FF",
  chevronUp: "#8EC8FF",
  arrowRight: "#8EC8FF",
  arrowRightOutline: "#8EC8FF",

  // Actions
  add: "#5EE8A0",
  addCircle: "#5EE8A0",
  addCircleOutline: "#5EE8A0",
  remove: "#F87171",
  removeCircle: "#F87171",
  close: "#686868",
  closeCircle: "#686868",
  refresh: "#5EE8A0",
  send: "#8EC8FF",
  edit: "#FFCC7A",
  logout: "#E8909D",
  arrowUp: "#5EE8A0",

  // Inventory
  item: "#8EC8FF",
  itemFilled: "#8EC8FF",
  batches: "#B8B0FF",
  barcode: "#5EE8A0",
  barcodeOutline: "#5EE8A0",
  archive: "#8EC8FF",
  archiveOutline: "#8EC8FF",
  price: "#5EE8A0",
  fingerprint: "#B8B0FF",

  // Status
  checkCircle: "#5EE8A0",
  checkCircleOutline: "#5EE8A0",
  checkDone: "#5EE8A0",
  warning: "#FFCC7A",
  info: "#8EC8FF",
  help: "#FFCC7A",

  // UI
  search: "#8EC8FF",
  list: "#8EC8FF",
  calendar: "#B8B0FF",
  time: "#FFCC7A",
  camera: "#8EC8FF",
  car: "#8EC8FF",
  restock: "#FFCC7A",
  cash: "#5EE8A0",
  chat: "#B8B0FF",
  person: "#8EC8FF",
  notifications: "#00FDAB",
  language: "#B8B0FF",
  settings: "#B8B0FF",
  business: "#8EC8FF",
  home: "#8EC8FF",
  homeFilled: "#FFFFFF",
  scan: "#5EE8A0",
  scanFilled: "#5EE8A0",
  moon: "#B8B0FF",
  sun: "#FFCC7A",
  toggles: "#B8B0FF",
};

// Per-icon default colors — LIGHT theme (saturated/darker on #FFFFFF)
const LIGHT_COLORS = {
  // Navigation
  back: "#3B82F6",
  forward: "#3B82F6",
  chevronDown: "#3B82F6",
  chevronUp: "#3B82F6",
  arrowRight: "#3B82F6",
  arrowRightOutline: "#3B82F6",

  // Actions
  add: "#10B981",
  addCircle: "#10B981",
  addCircleOutline: "#10B981",
  remove: "#EF4444",
  removeCircle: "#EF4444",
  close: "#9CA3AF",
  closeCircle: "#9CA3AF",
  refresh: "#10B981",
  send: "#3B82F6",
  edit: "#D97706",
  logout: "#DC2626",
  arrowUp: "#10B981",

  // Inventory
  item: "#3B82F6",
  itemFilled: "#3B82F6",
  batches: "#7C3AED",
  barcode: "#10B981",
  barcodeOutline: "#10B981",
  archive: "#3B82F6",
  archiveOutline: "#3B82F6",
  price: "#10B981",
  fingerprint: "#7C3AED",

  // Status
  checkCircle: "#10B981",
  checkCircleOutline: "#10B981",
  checkDone: "#10B981",
  warning: "#D97706",
  info: "#3B82F6",
  help: "#D97706",

  // UI
  search: "#3B82F6",
  list: "#3B82F6",
  calendar: "#7C3AED",
  time: "#D97706",
  camera: "#3B82F6",
  car: "#3B82F6",
  restock: "#D97706",
  cash: "#10B981",
  chat: "#7C3AED",
  person: "#3B82F6",
  notifications: "#00FDAB",
  language: "#7C3AED",
  settings: "#7C3AED",
  business: "#3B82F6",
  home: "#3B82F6",
  homeFilled: "#151515",
  scan: "#10B981",
  scanFilled: "#10B981",
  moon: "#7C3AED",
  sun: "#D97706",
  toggles: "#7C3AED",
};

export const ICON_SIZES = {
  xs: 10,
  sm: 12,
  md: 16,
  nav: 18,
  lg: 20,
  xl: 24,
  xxl: 32,
  hero: 48,
};

// Icon box (background container) colors — DARK theme
const DARK_BOX_COLORS = {
  item: "rgba(142,200,255,0.14)",
  itemFilled: "rgba(142,200,255,0.14)",
  batches: "rgba(184,176,255,0.14)",
  barcode: "rgba(94,232,160,0.14)",
  barcodeOutline: "rgba(94,232,160,0.14)",
  archive: "rgba(142,200,255,0.14)",
  archiveOutline: "rgba(142,200,255,0.14)",
  price: "rgba(94,232,160,0.14)",
  fingerprint: "rgba(184,176,255,0.14)",
  addCircle: "rgba(94,232,160,0.14)",
  addCircleOutline: "rgba(94,232,160,0.14)",
  add: "rgba(94,232,160,0.14)",
  removeCircle: "rgba(248,113,113,0.14)",
  remove: "rgba(248,113,113,0.14)",
  warning: "rgba(255,204,122,0.14)",
  checkCircle: "rgba(94,232,160,0.14)",
  checkCircleOutline: "rgba(94,232,160,0.14)",
  checkDone: "rgba(94,232,160,0.14)",
  calendar: "rgba(184,176,255,0.14)",
  time: "rgba(255,204,122,0.14)",
  restock: "rgba(255,204,122,0.14)",
  cash: "rgba(94,232,160,0.14)",
  chat: "rgba(184,176,255,0.14)",
  person: "rgba(142,200,255,0.14)",
  send: "rgba(142,200,255,0.14)",
  edit: "rgba(255,204,122,0.14)",
  logout: "rgba(232,144,157,0.14)",
  camera: "rgba(142,200,255,0.14)",
  car: "rgba(142,200,255,0.14)",
  language: "rgba(184,176,255,0.14)",
  info: "rgba(142,200,255,0.14)",
  help: "rgba(255,204,122,0.14)",
  scan: "rgba(94,232,160,0.14)",
  scanFilled: "rgba(94,232,160,0.14)",
  refresh: "rgba(94,232,160,0.14)",
  search: "rgba(142,200,255,0.14)",
  business: "rgba(142,200,255,0.14)",
  settings: "rgba(184,176,255,0.14)",
  list: "rgba(142,200,255,0.14)",
  home: "rgba(142,200,255,0.14)",
  back: "rgba(142,200,255,0.14)",
  forward: "rgba(142,200,255,0.14)",
  arrowRight: "rgba(142,200,255,0.14)",
  arrowRightOutline: "rgba(142,200,255,0.14)",
  toggles: "rgba(184,176,255,0.14)",
};

// Icon box (background container) colors — LIGHT theme
const LIGHT_BOX_COLORS = {
  item: "rgba(59,130,246,0.1)",
  itemFilled: "rgba(59,130,246,0.1)",
  batches: "rgba(124,58,237,0.1)",
  barcode: "rgba(16,185,129,0.1)",
  barcodeOutline: "rgba(16,185,129,0.1)",
  archive: "rgba(59,130,246,0.1)",
  archiveOutline: "rgba(59,130,246,0.1)",
  price: "rgba(16,185,129,0.1)",
  fingerprint: "rgba(124,58,237,0.1)",
  addCircle: "rgba(16,185,129,0.1)",
  addCircleOutline: "rgba(16,185,129,0.1)",
  add: "rgba(16,185,129,0.1)",
  removeCircle: "rgba(239,68,68,0.1)",
  remove: "rgba(239,68,68,0.1)",
  warning: "rgba(217,119,6,0.1)",
  checkCircle: "rgba(16,185,129,0.1)",
  checkCircleOutline: "rgba(16,185,129,0.1)",
  checkDone: "rgba(16,185,129,0.1)",
  calendar: "rgba(124,58,237,0.1)",
  time: "rgba(217,119,6,0.1)",
  restock: "rgba(217,119,6,0.1)",
  cash: "rgba(16,185,129,0.1)",
  chat: "rgba(124,58,237,0.1)",
  person: "rgba(59,130,246,0.1)",
  notifications: "rgba(217,119,6,0.1)",
  send: "rgba(59,130,246,0.1)",
  edit: "rgba(217,119,6,0.1)",
  logout: "rgba(220,38,38,0.1)",
  camera: "rgba(59,130,246,0.1)",
  car: "rgba(59,130,246,0.1)",
  language: "rgba(124,58,237,0.1)",
  info: "rgba(59,130,246,0.1)",
  help: "rgba(217,119,6,0.1)",
  scan: "rgba(16,185,129,0.1)",
  scanFilled: "rgba(16,185,129,0.1)",
  refresh: "rgba(16,185,129,0.1)",
  search: "rgba(59,130,246,0.1)",
  business: "rgba(59,130,246,0.1)",
  settings: "rgba(124,58,237,0.1)",
  list: "rgba(59,130,246,0.1)",
  home: "rgba(59,130,246,0.1)",
  back: "rgba(59,130,246,0.1)",
  forward: "rgba(59,130,246,0.1)",
  arrowRight: "rgba(59,130,246,0.1)",
  arrowRightOutline: "rgba(59,130,246,0.1)",
  toggles: "rgba(124,58,237,0.1)",
};

// Reverse map: raw ionicons string → semantic key (for config objects that store ICONS.xxx values)
const RAW_TO_SEMANTIC = Object.fromEntries(
  Object.entries(ICONS).map(([k, v]) => [v, k]),
);

/**
 * Returns the tinted box background color for an icon.
 * Accepts either a semantic key ("item") or a raw Ionicons name ("cube-outline").
 */
export function getIconBoxColor(name, isDark) {
  const key =
    ICONS[name] !== undefined ? name : (RAW_TO_SEMANTIC[name] ?? name);
  const palette = isDark ? DARK_BOX_COLORS : LIGHT_BOX_COLORS;
  return (
    palette[key] ?? (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)")
  );
}

/**
 * AppIcon — theme-aware icon component.
 * `name`: semantic key from ICONS or raw Ionicons name.
 * `color`: explicit override; omit to use per-icon theme default.
 */
export function AppIcon({ name, size = ICON_SIZES.lg, color, style }) {
  const { colors } = useTheme();
  const iconName = ICONS[name] ?? name;
  const palette = colors.isDark ? DARK_COLORS : LIGHT_COLORS;
  const resolvedColor = color ?? palette[name] ?? ICON_COLORS.default;
  return (
    <Ionicons name={iconName} size={size} color={resolvedColor} style={style} />
  );
}
