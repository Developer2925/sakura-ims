import {
  BarChart3,
  LayoutDashboard,
  LogOut,
  Moon,
  PackageSearch,
  Sun,
  TrendingUp,
  Users,
} from "lucide-react";
import logoDark from "../assets/logo.png";
import logoLight from "../assets/logo-light.png";

function IconBell({ hasDot }) {
  return (
    <>
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        {hasDot && <circle cx="18" cy="5" r="3" fill="#B8B0FF" stroke="none" />}
      </svg>
    </>
  );
}
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useLang } from "../lib/i18n";
import { useTheme } from "../lib/theme";

const NAV_SECTIONS = [
  {
    label: "MAIN",
    items: [{ path: "/dashboard", key: "dashboard", Icon: LayoutDashboard }],
  },
  {
    label: "MANAGEMENT",
    items: [
      { path: "/clinics", key: "clinics", Icon: Users },
      { path: "/restock", key: "restockRequests", Icon: PackageSearch },
    ],
  },
  {
    label: "ANALYTICS",
    items: [
      { path: "/analytics", key: "analytics", Icon: BarChart3, exact: true },
      { path: "/analytics/overall", key: "overallAnalytics", Icon: TrendingUp },
    ],
  },
];
const ALL_NAV_ITEMS = NAV_SECTIONS.flatMap((s) => s.items);

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { lang, toggle, t } = useLang();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);

  // Poll pending restock requests every 60 seconds
  useEffect(() => {
    function fetchPending() {
      api
        .getRestockRequests({ status: "pending" })
        .then((d) => setPendingCount(d.requests?.length ?? 0))
        .catch(() => {});
    }
    fetchPending();
    const interval = setInterval(fetchPending, 60_000);
    return () => clearInterval(interval);
  }, []);

  // Re-fetch when navigating away from restock page (requests may have been actioned)
  useEffect(() => {
    if (location.pathname !== "/restock") {
      api
        .getRestockRequests({ status: "pending" })
        .then((d) => setPendingCount(d.requests?.length ?? 0))
        .catch(() => {});
    }
  }, [location.pathname]);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const currentNav = ALL_NAV_ITEMS.find(
    (n) =>
      location.pathname === n.path ||
      (!n.exact && location.pathname.startsWith(n.path + "/")),
  );
  const currentSection = NAV_SECTIONS.find((s) =>
    s.items.some((n) => n === currentNav),
  );
  const pageTitle = currentNav ? t(currentNav.key) : t("dashboard");

  return (
    <div
      style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}
    >
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <img
              src={isDark ? logoDark : logoLight}
              alt="logo"
              style={{ width: 24, height: 24, objectFit: "contain" }}
            />
          </div>
          <div>
            <div className="sidebar-brand-name">Clinic Admin</div>
            <div className="sidebar-brand-sub">Management System</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV_SECTIONS.map(({ label, items }) => (
            <div key={label} className="nav-section">
              <div className="nav-section-label">{label}</div>
              {items.map(({ path, key, Icon, exact }) => {
                const active =
                  location.pathname === path ||
                  (!exact && location.pathname.startsWith(path + "/"));
                return (
                  <Link
                    key={path}
                    to={path}
                    className={`nav-item${active ? " active" : ""}`}
                  >
                    <Icon size={16} />
                    <span className="nav-item-label">{t(key)}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={18} />
            <span>{t("signOut")}</span>
          </button>
        </div>
      </aside>

      {/* ── Top bar ── */}
      <header className="topbar">
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>Clinic Admin</span>
            <span style={{ color: "var(--text-muted)", fontSize: 16 }}>/</span>
            <span style={{ color: "var(--text)", fontWeight: 700 }}>{pageTitle}</span>
          </div>
        </div>

        <div className="topbar-actions">
          <button
            onClick={toggleTheme}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            style={{ background: "none", border: "none", padding: "4px", color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button
            onClick={toggle}
            title={lang === "en" ? "Switch to Japanese" : "英語に切り替える"}
            style={{ background: "none", border: "none", padding: "4px", color: "var(--text-secondary)", cursor: "pointer", fontWeight: 700, fontSize: 11, lineHeight: "18px" }}
          >
            {lang === "en" ? "JP" : "EN"}
          </button>

          <button
            onClick={() => navigate("/restock")}
            title={
              pendingCount > 0
                ? `${pendingCount} pending request${pendingCount > 1 ? "s" : ""}`
                : "Notifications"
            }
            style={{
              background: "none",
              border: "none",
              padding: "4px",
              borderRadius: 8,
              color: "var(--text-secondary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              cursor: "pointer",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--text-secondary)")
            }
          >
            <IconBell hasDot={pendingCount > 0} />
            {pendingCount > 0 && (
              <span className="badge-count">
                {pendingCount > 99 ? "99+" : pendingCount}
              </span>
            )}
          </button>

        </div>
      </header>

      {/* ── Page content ── */}
      <main className="main-content">
        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}
