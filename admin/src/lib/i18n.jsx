import { createContext, useContext, useState } from 'react';

const T = {
  en: {
    loading: 'Loading...', save: 'Save', cancel: 'Cancel', edit: 'Edit', back: 'Back',
    noData: 'No data found', done: 'Done', notSet: '— not set',

    // Login
    signIn: 'Sign In', adminCredentials: 'Enter your admin credentials to continue',
    username: 'Username', password: 'Password', signingIn: 'Signing in...',
    manageClinics: 'Manage 28+ Clinics', monitorInventory: 'Monitor inventory across all locations',
    smartRestock: 'Smart Restock Alerts', approveDeliver: 'Approve and deliver restock requests',
    analyticsDash: 'Analytics Dashboard', usageInsights: 'Monthly usage and cost insights',

    // Nav
    dashboard: 'Dashboard', clinics: 'Clinics', restockRequests: 'Restock Requests',
    analytics: 'Analytics', signOut: 'Sign Out', searchAnything: 'Search anything...',

    // Dashboard
    totalClinics: 'Total Clinics', totalItems: 'Total Items',
    pendingRequests: 'Pending Requests', totalStockValue: 'Total Stock Value',
    awaitingDelivery: 'approved request(s) awaiting delivery.',
    recentRestockRequests: 'Recent Restock Requests', viewAll: 'View All',
    noRestockRequests: 'No restock requests yet',
    item: 'Item', clinic: 'Clinic', qty: 'Qty', status: 'Status', date: 'Date',

    // Clinics
    clinicList: 'Clinic List', clinicName: 'Clinic Name', passwordCol: 'Password',
    email: 'Email', items: 'Items', stock: 'Stock', value: 'Value', actions: 'Actions',
    searchClinics: 'Search by clinic name, username, or email...',
    noClinicsFound: 'No clinics found', inventory: 'Inventory',
    editClinicCredentials: 'Edit Clinic Credentials', newPassword: 'New Password',
    leaveBlank: '(leave blank to keep current)', enterNewPassword: 'Enter new password...',
    saveChanges: 'Save Changes', saving: 'Saving...',
    sendLoginCredentials: 'Send Login Credentials', sendingTo: 'Sending to',
    passwordToSend: 'Password to Send', typePassword: 'Type the password for this clinic...',
    passwordNote: "This password will be visible in the email. Make sure it matches what's in the system.",
    deleteClinic: 'Clear Data', deleteClinicConfirm: 'Clear All Inventory Data?',
    deleteClinicWarning: 'This will permanently delete all items, inventory, batches, transactions, and restock requests for this clinic. The clinic account will remain. This cannot be undone.',
    deleteClinicBtn: 'Clear All Data', deleting: 'Clearing...',
    sendEmail: 'Send Email', sending: 'Sending...', credentialsSent: 'Credentials Sent!',
    loginDetailsEmailed: 'Login details emailed to',
    noEmailSet: '⚠ No email set — edit clinic first',
    setEmailFirst: 'Set email first', sendTo: 'Send to',

    // Restock Requests
    all: 'All', pending: 'Pending', approved: 'Approved', rejected: 'Rejected', out_for_delivery: 'Out for Delivery', delivered: 'Delivered',
    requested: 'Requested', approvedDate: 'Approved', shippedDate: 'Shipped', deliveredDate: 'Delivered',
    approve: 'Approve', reject: 'Reject', deliver: 'Deliver', ship: 'Ship',
    outForDelivery: 'Out for Delivery', awaitingClinicConfirm: 'Awaiting clinic confirmation',
    noRequestsFound: 'No requests found', approveRequest: 'Approve Request',
    rejectRequest: 'Reject Request', adminNote: 'Admin Note', optional: '(optional)',
    addNoteForClinic: 'Add a note for the clinic...',
    confirmApprove: 'Confirm Approve', confirmReject: 'Confirm Reject',

    // Analytics
    monthlyAnalytics: 'Monthly Analytics', month: 'Month', allClinics: 'All Clinics',
    totalRequests: 'Total Requests', restocksDone: 'Restocks Done',
    restockedQty: 'Restocked Qty', totalStock: 'Total Stock', totalReceived: 'Total Received', overall: 'Overall', monthly: 'Monthly', overallAnalytics: 'Overall Analytics',
    remainingStock: 'Remaining Stock', usedQty: 'Used Qty',
    stockCost: 'Stock Cost', totalStockCost: 'Total Stock Cost',
    usedCost: 'Used Cost', remainingCost: 'Remaining Cost',
    usageRate: 'Usage Rate', usedLabel: 'Used', totalLabel: 'Total', units: 'units',

    // Clinic Inventory
    totalStockValueLabel: 'Total Stock Value', searchItems: 'Search by item name or category...',
    itemName: 'Item Name', category: 'Category', price: 'Price', totalValue: 'Total Value',
    expiry: 'Expiry', noItemsFound: 'No items found', updateFailed: 'Update failed',
    stockedDate: 'Stocked',

    // Clinics / Items overview
    viewDetails: 'View Details', stockDetailsPerClinic: 'Stock details per clinic',
    stockShare: 'Stock Share',
    refresh: 'Refresh',
  },

  ja: {
    loading: '読み込み中...', save: '保存', cancel: 'キャンセル', edit: '編集', back: '戻る',
    noData: 'データが見つかりません', done: '完了', notSet: '— 未設定',

    // Login
    signIn: 'サインイン', adminCredentials: '管理者の認証情報を入力してください',
    username: 'ユーザー名', password: 'パスワード', signingIn: 'サインイン中...',
    manageClinics: '28以上のクリニックを管理', monitorInventory: '全拠点の在庫を監視',
    smartRestock: 'スマート補充アラート', approveDeliver: '補充リクエストを承認・納品',
    analyticsDash: '分析ダッシュボード', usageInsights: '月次使用状況・コスト分析',

    // Nav
    dashboard: 'ダッシュボード', clinics: 'クリニック', restockRequests: '補充リクエスト',
    analytics: '分析', signOut: 'サインアウト', searchAnything: '何でも検索...',

    // Dashboard
    totalClinics: 'クリニック総数', totalItems: 'アイテム総数',
    pendingRequests: '保留中リクエスト', totalStockValue: '在庫総額',
    awaitingDelivery: '件の承認済みリクエストが納品待ちです。',
    recentRestockRequests: '最近の補充リクエスト', viewAll: 'すべて表示',
    noRestockRequests: '補充リクエストはありません',
    item: 'アイテム', clinic: 'クリニック', qty: '数量', status: 'ステータス', date: '日付',

    // Clinics
    clinicList: 'クリニック一覧', clinicName: 'クリニック名', passwordCol: 'パスワード',
    email: 'メール', items: 'アイテム', stock: '在庫', value: '金額', actions: '操作',
    searchClinics: 'クリニック名・ユーザー名・メールで検索...',
    noClinicsFound: 'クリニックが見つかりません', inventory: '在庫',
    editClinicCredentials: 'クリニック認証情報を編集', newPassword: '新しいパスワード',
    leaveBlank: '(空白のままにすると現在のパスワードを維持)', enterNewPassword: '新しいパスワードを入力...',
    saveChanges: '変更を保存', saving: '保存中...',
    sendLoginCredentials: 'ログイン情報を送信', sendingTo: '送信先',
    passwordToSend: '送信するパスワード', typePassword: 'このクリニックのパスワードを入力...',
    passwordNote: 'このパスワードはメールに表示されます。システムと一致していることを確認してください。',
    deleteClinic: 'データを削除', deleteClinicConfirm: '在庫データをすべて削除しますか？',
    deleteClinicWarning: 'このクリニックのアイテム・在庫・バッチ・取引・補充リクエストがすべて完全に削除されます。クリニックアカウントは残ります。元に戻せません。',
    deleteClinicBtn: 'すべてのデータを削除', deleting: '削除中...',
    sendEmail: 'メールを送信', sending: '送信中...', credentialsSent: '認証情報を送信しました！',
    loginDetailsEmailed: 'ログイン情報をメール送信しました：',
    noEmailSet: '⚠ メール未設定 — 先にクリニックを編集してください',
    setEmailFirst: '先にメールを設定してください', sendTo: '送信先',

    // Restock Requests
    all: 'すべて', pending: '保留中', approved: '承認済み', rejected: '却下', out_for_delivery: '配送中', delivered: '納品済み',
    requested: 'リクエスト日', approvedDate: '承認日', shippedDate: '発送日', deliveredDate: '納品日',
    approve: '承認', reject: '却下', deliver: '納品', ship: '発送',
    outForDelivery: '配送中', awaitingClinicConfirm: 'クリニックの確認待ち',
    noRequestsFound: 'リクエストが見つかりません', approveRequest: 'リクエストを承認',
    rejectRequest: 'リクエストを却下', adminNote: '管理者メモ', optional: '(任意)',
    addNoteForClinic: 'クリニックへのメモを追加...',
    confirmApprove: '承認を確定', confirmReject: '却下を確定',

    // Analytics
    monthlyAnalytics: '月次分析', month: '月', allClinics: 'すべてのクリニック',
    totalRequests: 'リクエスト数', restocksDone: '補充完了数',
    restockedQty: '補充数量', totalStock: '総在庫数', totalReceived: '総受入数', overall: '全体', monthly: '月次', overallAnalytics: '全体分析',
    remainingStock: '残在庫数', usedQty: '使用数量',
    stockCost: '在庫コスト', totalStockCost: '総在庫コスト',
    usedCost: '使用済みコスト', remainingCost: '残在庫コスト',
    usageRate: '使用率', usedLabel: '使用済み', totalLabel: '総数', units: '点',

    // Clinic Inventory
    totalStockValueLabel: '在庫総額', searchItems: 'アイテム名またはカテゴリーで検索...',
    itemName: 'アイテム名', category: 'カテゴリー', price: '価格', totalValue: '合計金額',
    expiry: '有効期限', noItemsFound: 'アイテムが見つかりません', updateFailed: '更新に失敗しました',
    stockedDate: '入庫日',

    // Clinics / Items overview
    viewDetails: '詳細を見る', stockDetailsPerClinic: 'クリニック別の在庫詳細',
    stockShare: '在庫シェア',
    refresh: '更新',
  },
};

const LangContext = createContext({ lang: 'en', toggle: () => {}, t: (k) => k });

export function LangProvider({ children }) {
  const [lang, setLang] = useState('en');
  const toggle = () => setLang((l) => (l === 'en' ? 'ja' : 'en'));
  const t = (key) => T[lang][key] ?? T.en[key] ?? key;
  return <LangContext.Provider value={{ lang, toggle, t }}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}
