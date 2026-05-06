import React, { createContext, useContext, useState, useEffect } from "react";
import { storage } from "./storage";

const T = {
  ja: {
    // General
    cancel: "キャンセル",
    save: "保存",
    error: "エラー",
    success: "完了",
    back: "戻る",
    confirm: "確認",
    loading: "読み込み中...",
    noResults: "結果がありません",
    items: "品目",
    pieces: "点",
    inStock: "在庫",
    low: "不足",
    done: "完了",

    // Auth
    loginTitle: "クリニックログイン",
    username: "ユーザー名",
    password: "パスワード",
    login: "サインイン",
    loginHint: "クリニックIDとパスワードを入力してください",
    loggingIn: "サインイン中…",
    loginWelcome: "おかえりなさい",
    loginSubtitle: "クリニックにサインイン",
    usernameRequired: "ユーザー名は必須です",
    passwordRequired: "パスワードは必須です",
    loginFailed: "ログイン失敗",
    invalidCredentials: "認証情報が無効です",
    adminHint: "管理者アカウントでもログインできます",
    usernamePlaceholder: "例: sakura_01",
    passwordPlaceholder: "パスワードを入力",

    // Dashboard
    insights: "インサイト",
    inventoryItems: "在庫アイテム",
    lowStock: "在庫不足",
    pendingRequests: "保留中リクエスト",
    deliveredThisMonth: "今月の納品",
    recentRequests: "最近のリクエスト",
    noRecentRequests: "補充リクエストがありません",
    signOut: "サインアウト",
    signOutConfirm: "本当によろしいですか？",
    exitAppTitle: "アプリを終了しますか？",
    exitAppMsg: "もう一度戻るボタンを押すと終了します。",
    exitApp: "終了",
    stayApp: "キャンセル",
    recentTransactions: "最近の取引",
    noTransactions: "取引履歴がありません",
    outForDeliveryTitle: "配送中のアイテム",
    outForDeliveryQty: "数量",
    outForDeliveryShipped: "発送日",
    language: "EN",

    // Inventory
    inventory: "在庫",
    searchPlaceholder: "名前またはカテゴリーで検索...",
    totalValue: "在庫総額",
    addItem: "アイテムを追加",
    addStock: "在庫追加",
    restockRequest: "補充リクエスト",
    noInventory: "在庫にアイテムがありません",
    noSearchResults: "検索結果がありません",
    barcodeChoiceTitle: "アイテムにバーコードはありますか？",
    barcodeChoiceSubtitle: "バーコードの有無に応じて追加方法を選択してください",
    withBarcodeBtn: "バーコードあり",
    withBarcodeSub: "バーコードをスキャンして追加",
    withoutBarcodeBtn: "手動でアイテム追加",
    withoutBarcodeSub: "バーコードなし・手動入力",
    cancelLabel: "キャンセル",
    manufacturerShort: "メーカー",
    conditionShort: "状態",

    // Use / Sell
    useItem: "アイテムを使用",
    sellItem: "在庫から使用",
    searchByName: "名前で検索...",
    selectQuantity: "使用数量",
    useBarcodeChoiceTitle: "バーコードはありますか？",
    useBarcodeChoiceSub: "使用するアイテムの追跡方法を選択",
    useBarcodeYes: "バーコードあり",
    useBarcodeYesSub: "バーコードをスキャンしてアイテムを選択",
    useBarcodeNo: "バーコードなし",
    useBarcodeNoSub: "リストからアイテムを選択",
    noBarcode: "バーコードなし",
    confirmUse: "使用を確認",
    insufficientStock: "在庫不足",
    useSuccess: "使用完了",
    usedItems: "使用済み",
    remaining: "残り",
    itemNotFound: "アイテムが見つかりません",
    searchItem: "アイテムを検索",
    tapToSelect: "タップして選択",
    noItemSelected: "アイテムを選択してください",

    // Add stock
    addStockTitle: "在庫を追加",
    currentStock: "現在の在庫",
    quantityToAdd: "追加数量",
    stockAdded: "在庫を追加しました",

    // History
    history: "履歴",
    all: "すべて",
    added: "追加",
    used: "使用",
    delivered: "納品",
    adminDelivery: "管理者による納品",
    noHistory: "取引履歴がありません",
    addedItems: "追加済み",
    usedItems2: "使用済み",

    // Restock
    restockStatus: "補充リクエスト",
    pending: "保留中",
    approved: "承認済み",
    rejected: "却下",
    out_for_delivery: "配送中",
    delivered: "納品済み",
    notes: "メモ",
    quantity: "数量",
    requestedAt: "リクエスト日",
    noRequests: "リクエストがありません",
    markAsReceived: "受け取り完了",

    // Confirm delivery screen
    confirmDeliveryTitle: "納品確認",
    confirmDeliverySubtitle: "受け取った在庫の詳細を入力してください",
    restockDateLabel: "補充日",
    expiryDateLabel: "有効期限 (YYYY-MM-DD)",
    unitPriceLabel: "単価 (¥) *",
    conditionLabel2: "状態",
    confirmReceive: "受け取りを確認",
    confirmingReceive: "確認中...",
    deliveryConfirmed: "納品確認完了",
    deliveryConfirmedMsg: "在庫が更新されました。",
    priceRequired: "有効な価格を入力してください",

    // Stocks received
    stocksReceived: "受け取り済み",
    totalReceived: "受け取り総数",

    // Add existing / item detail
    itemDetail: "アイテム詳細",
    categoryLabel: "カテゴリー",
    conditionLabel: "状態",
    priceLabel: "価格",
    totalPriceLabel: "合計金額",
    expiryLabel: "有効期限",
    manufacturerLabel: "メーカー",
    itemNotFoundEmpty: "アイテムが見つかりません",

    // Add manual / add new item
    addManualTitle: "手動でアイテム追加",
    newItemTitle: "新規アイテム",
    noBarcodeNote: "バーコードなし · 内部IDが自動生成されます",
    autoFilled: "自動入力",
    itemNameLabel: "アイテム名 *",
    manufacturerOptLabel: "メーカー",
    categoryChipLabel: "カテゴリー *",
    customCategoryLabel: "カテゴリー名 *",
    conditionChipLabel: "状態",
    priceChipLabel: "価格 *",
    expiryChipLabel: "有効期限 (YYYY-MM-DD)",
    expiryRequiredLabel: "有効期限 * (YYYY-MM-DD)",
    expiryOptionalLabel: "有効期限 (任意)",
    qtyLabel: "数量",
    saveItem: "アイテムを保存",
    manualAddBtn: "手動で追加（バーコードなし）",
    savingMsg: "保存中...",
    savedTitle: "保存しました",
    failedToSave: "アイテムの保存に失敗しました。",
    addedToInventory: "を在庫に追加しました。",
    savingItem: "アイテムを保存中...",
    itemNameRequired: "アイテム名は必須です",
    selectCategoryError: "カテゴリーを選択してください",
    customCategoryRequired: "カテゴリー名を入力してください",
    validPrice: "有効な価格を入力してください",

    // Categories & Conditions (display labels, values stay in Japanese for DB consistency)
    cat_medicine: "医薬品",
    cat_equipment: "機器",
    cat_consumables: "消耗品",
    cat_surgical: "手術用品",
    cat_other: "その他",
    cond_new: "新品",
    cond_good: "良好",
    cond_fair: "普通",
    cond_expired: "期限切れ",

    // Restock request screen
    restockRequestTitle: "補充リクエスト",
    requestQty: "リクエスト数量",
    optionalNotes: "備考 (任意)",
    notesPlaceholder: "補充の理由や詳細を入力...",
    restockInfoText:
      "リクエストは管理者に送信されます。承認後、在庫が更新されます。",
    sendRequest: "リクエストを送信",
    submitting: "送信中...",
    requestSentTitle: "リクエスト送信済み",
    failedToSendRequest: "リクエストの送信に失敗しました。",
    adminWillReview: "管理者が確認します。",

    // Restock status screen
    requestCountLabel: "リクエスト数",
    adminNoteLabel: "管理者メモ",

    // Stocks received screen
    receivedLabel: "入庫",
    requestedLabel: "リクエスト",
    deliveredLabel: "納品",
    noReceivedItems: "受け取り済みのアイテムはありません",
    totalReceivedSummary: "合計",
    totalReceivedSuffix: "点 受領済み",

    // Confirm dialogs
    confirmAddTitle: "追加しますか？",
    confirmAddMsg: "このアイテムを在庫に追加します。",
    confirmAddStockTitle: "在庫を追加しますか？",
    confirmAddStockMsg: "指定した数量を在庫に追加します。",
    confirmRestockTitle: "リクエストを送信しますか？",
    confirmRestockMsg: "管理者に補充リクエストを送信します。",
    confirmUseTitle: "使用しますか？",
    confirmUseMsg: "指定した数量を使用済みにします。",

    // Add scan sheet labels
    newItemSheet: "新規アイテム",
    existingItemSheet: "既存アイテム",

    // Batch management
    batches: "バッチ",
    batchLabel: "バッチ",
    newBatch: "新しいバッチを追加",
    addToExistingBatch: "既存バッチに追加",
    selectBatch: "バッチを選択",
    batchCount: "バッチ",
    noBatchesYet: "バッチがありません",
    batchExpiry: "有効期限",
    batchPrice: "価格",
    batchQty: "数量",
    addNewBatchTitle: "新規バッチ追加",
    existingBatchTitle: "既存バッチに追加",
    batchModeExisting: "既存バッチ",
    batchModeNew: "新しいバッチ",
    selectBatchHint: "バッチを選択して在庫を追加",
    newBatchPriceLabel: "単価 (¥) *",
    newBatchExpiryLabel: "有効期限 (YYYY-MM-DD)",
    newBatchConditionLabel: "状態",
    barcodeLabel: "バーコード",
    internalIdLabel: "内部ID",
    validBatchPrice: "有効な価格を入力してください",

    // Settings
    settingsTitle: "設定",
    settingsPreferences: "設定",
    settingsAccount: "アカウント",
    settingsAppInfo: "アプリ情報",
    settingsPermissionsSection: "権限",
    settingsLanguage: "言語",
    settingsLanguageValue: "日本語",
    settingsLogout: "サインアウト",
    settingsVersion: "バージョン",
    settingsCameraPermission: "カメラ",
    settingsPermissionGranted: "許可済み",
    settingsPermissionDenied: "拒否",
    settingsOpenSettings: "システム設定を開く",

    // Barcode scanner
    cameraChecking: "カメラの権限を確認中…",
    cameraPermRequired: "カメラの許可が必要です",
    cameraPermDesc: "JANコードをスキャンするにはカメラへのアクセスが必要です。",
    cameraPermAllow: "アクセスを許可",
  },

  en: {
    // General
    cancel: "Cancel",
    save: "Save",
    error: "Error",
    success: "Success",
    back: "Back",
    confirm: "Confirm",
    loading: "Loading...",
    noResults: "No results",
    items: "items",
    pieces: "pcs",
    inStock: "In Stock",
    low: "Low",
    done: "Done",

    // Auth
    loginTitle: "Clinic Login",
    username: "Username",
    password: "Password",
    login: "Sign In",
    loginHint: "Enter your clinic ID and password",
    loggingIn: "Signing in…",
    loginWelcome: "Welcome back",
    loginSubtitle: "Sign in to your clinic",
    usernameRequired: "Username is required",
    passwordRequired: "Password is required",
    loginFailed: "Login Failed",
    invalidCredentials: "Invalid credentials",
    adminHint: "Admin accounts can also log in here",
    usernamePlaceholder: "e.g. sakura_01",
    passwordPlaceholder: "Enter your password",

    // Dashboard
    insights: "Insights",
    inventoryItems: "Inventory Items",
    lowStock: "Low Stock",
    pendingRequests: "Pending Requests",
    deliveredThisMonth: "Delivered This Month",
    recentRequests: "Recent Requests",
    noRecentRequests: "No restock requests",
    signOut: "Sign Out",
    signOutConfirm: "Are you sure you want to sign out?",
    exitAppTitle: "Exit App?",
    exitAppMsg: "Press back again to exit the application.",
    exitApp: "Exit",
    stayApp: "Stay",
    recentTransactions: "Recent Transactions",
    noTransactions: "No transactions yet",
    outForDeliveryTitle: "Items Out for Delivery",
    outForDeliveryQty: "Qty",
    outForDeliveryShipped: "Shipped",
    language: "JP",

    // Inventory
    inventory: "Inventory",
    searchPlaceholder: "Search by name or category...",
    totalValue: "Total Value",
    addItem: "Add Item",
    addStock: "Add Stock",
    restockRequest: "Restock Request",
    noInventory: "No items in inventory",
    noSearchResults: "No search results",
    barcodeChoiceTitle: "Does your item have a barcode?",
    barcodeChoiceSubtitle: "Choose how you want to add your item",
    withBarcodeBtn: "Has Barcode",
    withBarcodeSub: "Scan barcode to add",
    withoutBarcodeBtn: "Add Manually",
    withoutBarcodeSub: "No barcode · enter details manually",
    cancelLabel: "Cancel",
    manufacturerShort: "Maker",
    conditionShort: "Condition",

    // Use / Sell
    useItem: "Use Item",
    sellItem: "Use from Stock",
    searchByName: "Search by name...",
    selectQuantity: "Quantity to Use",
    useBarcodeChoiceTitle: "Does your item have a barcode?",
    useBarcodeChoiceSub: "Choose how to find the item",
    useBarcodeYes: "Has Barcode",
    useBarcodeYesSub: "Scan barcode to find item",
    useBarcodeNo: "No Barcode",
    useBarcodeNoSub: "Select item from list",
    noBarcode: "No barcode",
    confirmUse: "Confirm Use",
    insufficientStock: "Insufficient Stock",
    useSuccess: "Usage Recorded",
    usedItems: "Used",
    remaining: "Remaining",
    itemNotFound: "Item not found",
    searchItem: "Search Item",
    tapToSelect: "Tap to select",
    noItemSelected: "Please select an item",

    // Add stock
    addStockTitle: "Add Stock",
    currentStock: "Current Stock",
    quantityToAdd: "Quantity to Add",
    stockAdded: "Stock added successfully",

    // History
    history: "History",
    all: "All",
    added: "Added",
    used: "Used",
    delivered: "Delivered",
    adminDelivery: "Admin Delivery",
    noHistory: "No transaction history",
    addedItems: "Added",
    usedItems2: "Used",

    // Restock
    restockStatus: "Restock Requests",
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    out_for_delivery: "Out for Delivery",
    delivered: "Delivered",
    notes: "Notes",
    quantity: "Quantity",
    requestedAt: "Requested",
    noRequests: "No requests",
    markAsReceived: "Mark as Received",

    // Confirm delivery screen
    confirmDeliveryTitle: "Confirm Delivery",
    confirmDeliverySubtitle: "Enter details for the received stock",
    restockDateLabel: "Restock Date",
    expiryDateLabel: "Expiry Date (YYYY-MM-DD)",
    unitPriceLabel: "Unit Price (¥) *",
    conditionLabel2: "Condition",
    confirmReceive: "Confirm Receipt",
    confirmingReceive: "Confirming...",
    deliveryConfirmed: "Delivery Confirmed",
    deliveryConfirmedMsg: "Stock has been updated.",
    priceRequired: "Please enter a valid price",

    // Stocks received
    stocksReceived: "Stocks Received",
    totalReceived: "Total Received",

    // Add existing / item detail
    itemDetail: "Item Details",
    categoryLabel: "Category",
    conditionLabel: "Condition",
    priceLabel: "Price",
    totalPriceLabel: "Total",
    expiryLabel: "Expiry",
    manufacturerLabel: "Manufacturer",
    itemNotFoundEmpty: "No items found",

    // Add manual / add new item
    addManualTitle: "Add Item Manually",
    newItemTitle: "New Item",
    noBarcodeNote: "No barcode · Internal ID will be auto-generated",
    autoFilled: "Auto-filled",
    itemNameLabel: "Item Name *",
    manufacturerOptLabel: "Manufacturer",
    categoryChipLabel: "Category *",
    customCategoryLabel: "Custom Category *",
    conditionChipLabel: "Condition",
    priceChipLabel: "Price *",
    expiryChipLabel: "Expiry Date (YYYY-MM-DD)",
    expiryRequiredLabel: "Expiry Date * (YYYY-MM-DD)",
    expiryOptionalLabel: "Expiry Date (optional)",
    qtyLabel: "Quantity",
    saveItem: "Save Item",
    manualAddBtn: "Add Manually (No Barcode)",
    savingMsg: "Saving...",
    savedTitle: "Saved",
    failedToSave: "Failed to save item.",
    addedToInventory: " has been added to inventory.",
    savingItem: "Saving item...",
    itemNameRequired: "Item name is required",
    selectCategoryError: "Please select a category",
    customCategoryRequired: "Please enter a category name",
    validPrice: "Please enter a valid price",

    // Categories & Conditions
    cat_medicine: "Pharmaceuticals",
    cat_equipment: "Equipment",
    cat_consumables: "Consumables",
    cat_surgical: "Surgical Supplies",
    cat_other: "Other",
    cond_new: "New",
    cond_good: "Good",
    cond_fair: "Fair",
    cond_expired: "Expired",

    // Restock request screen
    restockRequestTitle: "Restock Request",
    requestQty: "Request Quantity",
    optionalNotes: "Notes (optional)",
    notesPlaceholder: "Enter reason or details...",
    restockInfoText:
      "Request will be sent to admin. Stock will be updated after approval.",
    sendRequest: "Send Request",
    submitting: "Sending...",
    requestSentTitle: "Request Sent",
    failedToSendRequest: "Failed to send request.",
    adminWillReview: "Admin will review it.",

    // Restock status screen
    requestCountLabel: "Qty Requested",
    adminNoteLabel: "Admin Note",

    // Stocks received screen
    receivedLabel: "Received",
    requestedLabel: "Requested",
    deliveredLabel: "Delivered",
    noReceivedItems: "No received items yet",
    totalReceivedSummary: "Total",
    totalReceivedSuffix: "units received",

    // Confirm dialogs
    confirmAddTitle: "Add Item?",
    confirmAddMsg: "This item will be added to inventory.",
    confirmAddStockTitle: "Add Stock?",
    confirmAddStockMsg: "Selected quantity will be added to stock.",
    confirmRestockTitle: "Send Request?",
    confirmRestockMsg: "A restock request will be sent to admin.",
    confirmUseTitle: "Use Item?",
    confirmUseMsg: "Selected quantity will be marked as used.",

    // Add scan sheet labels
    newItemSheet: "New Item",
    existingItemSheet: "Existing Item",

    // Batch management
    batches: "Batches",
    batchLabel: "Batch",
    newBatch: "Add New Batch",
    addToExistingBatch: "Add to Existing Batch",
    selectBatch: "Select Batch",
    batchCount: "batches",
    noBatchesYet: "No batches yet",
    batchExpiry: "Expiry",
    batchPrice: "Price",
    batchQty: "Qty",
    addNewBatchTitle: "New Batch",
    existingBatchTitle: "Add to Existing Batch",
    batchModeExisting: "Existing Batch",
    batchModeNew: "New Batch",
    selectBatchHint: "Select a batch to add stock to",
    newBatchPriceLabel: "Unit Price (¥) *",
    newBatchExpiryLabel: "Expiry Date (YYYY-MM-DD)",
    newBatchConditionLabel: "Condition",
    barcodeLabel: "Barcode",
    internalIdLabel: "Internal ID",
    validBatchPrice: "Please enter a valid price",

    // Settings
    settingsTitle: "Settings",
    settingsPreferences: "Preferences",
    settingsAccount: "Account",
    settingsAppInfo: "App Info",
    settingsPermissionsSection: "Permissions",
    settingsLanguage: "Language",
    settingsLanguageValue: "English",
    settingsLogout: "Sign Out",
    settingsVersion: "Version",
    settingsCameraPermission: "Camera",
    settingsPermissionGranted: "Granted",
    settingsPermissionDenied: "Denied",
    settingsOpenSettings: "Open System Settings",

    // Barcode scanner
    cameraChecking: "Checking camera permission…",
    cameraPermRequired: "Camera Access Required",
    cameraPermDesc: "Camera access is needed to scan JAN barcodes.",
    cameraPermAllow: "Allow Access",
  },
};

const LANG_KEY = "app_lang";

const LangContext = createContext({
  lang: "en",
  toggle: () => {},
  t: (k) => k,
});

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState("en");

  useEffect(() => {
    storage.get(LANG_KEY).then((saved) => {
      if (saved === "ja" || saved === "en") setLang(saved);
    });
  }, []);

  const toggle = () => {
    setLang((l) => {
      const next = l === "ja" ? "en" : "ja";
      storage.set(LANG_KEY, next);
      return next;
    });
  };

  const t = (key) => T[lang][key] ?? T.en[key] ?? key;
  const COND_MAP = {
    新品: "cond_new",
    良好: "cond_good",
    普通: "cond_fair",
    期限切れ: "cond_expired",
  };
  const tCondition = (val) => (val ? t(COND_MAP[val] ?? val) : val);
  return (
    <LangContext.Provider value={{ lang, toggle, t, tCondition }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
