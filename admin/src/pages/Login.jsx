import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import { useAuth } from "../lib/auth";
import { useLang } from "../lib/i18n";
import { useTheme } from "../lib/theme";
import { AlertCircle, Lock, User } from "lucide-react";
import logoDark from "../assets/logo.png";
import logoLight from "../assets/logo-light.png";
export default function Login() {
  const { login } = useAuth();
  const { lang, toggle, t } = useLang();
  const { isDark } = useTheme();
  const logo = isDark ? logoDark : logoLight;
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const screenRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(".login-left", { x: -50, opacity: 0, duration: 0.55 })
        .from(
          ".login-left-logo",
          { y: -10, opacity: 0, duration: 0.35 },
          "-=0.25",
        )
        .from(
          ".login-left-heading",
          { y: 14, opacity: 0, duration: 0.35 },
          "-=0.2",
        )
        .from(
          ".login-left-feature",
          { x: -16, opacity: 0, stagger: 0.07, duration: 0.3 },
          "-=0.15",
        )
        .from(".login-card", { x: 50, opacity: 0, duration: 0.55 }, 0.1)
        .from(
          ".login-card-logo",
          { scale: 0.75, opacity: 0, duration: 0.3 },
          "-=0.3",
        )
        .from(
          ".login-card-heading",
          { y: 10, opacity: 0, duration: 0.28 },
          "-=0.18",
        )
        .from(
          ".login-form-group",
          { y: 10, opacity: 0, stagger: 0.06, duration: 0.28 },
          "-=0.15",
        );
    }, screenRef);
    return () => ctx.revert();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username.trim(), password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-screen" ref={screenRef}>
      {/* Left panel */}
      <div className="login-left">
        <div style={{ marginBottom: 48 }}>
          <div
            className="login-left-logo"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 48,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: isDark
                  ? "rgba(255,255,255,0.15)"
                  : "rgba(0,0,0,0.07)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img
                src={logo}
                alt="logo"
                style={{ width: 28, height: 28, objectFit: "contain" }}
              />
            </div>
            <span style={{ fontWeight: 800, fontSize: 20, color: "#fff" }}>
              Clinic Admin
            </span>
          </div>
          <div className="login-left-heading">
            <h1>
              Welcome back to the
              <br />
              Clinic Management System
            </h1>
            <p style={{ marginTop: 16 }}>
              Manage clinics, inventory, and restock requests all in one place.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            [t("manageClinics"), t("monitorInventory")],
            [t("smartRestock"), t("approveDeliver")],
            [t("analyticsDash"), t("usageInsights")],
          ].map(([title, sub]) => (
            <div
              key={title}
              className="login-left-feature"
              style={{ display: "flex", alignItems: "flex-start", gap: 12 }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.5)",
                  marginTop: 6,
                  flexShrink: 0,
                }}
              />
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{title}</div>
                <div style={{ fontSize: 13, opacity: 0.65, marginTop: 2 }}>
                  {sub}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="login-right">
        <div className="login-card">
          <div className="login-logo login-card-logo">
            <img
              src={logo}
              alt="logo"
              style={{ width: 32, height: 32, objectFit: "contain" }}
            />
          </div>
          <h2 className="login-card-heading">{t("signIn")}</h2>
          <p className="sub">{t("adminCredentials")}</p>

          {error && (
            <div className="error-box">
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group login-form-group">
              <label className="form-label">{t("username")}</label>
              <div style={{ position: "relative" }}>
                <User
                  size={15}
                  style={{
                    position: "absolute",
                    left: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-secondary)",
                    pointerEvents: "none",
                  }}
                />
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  autoComplete="username"
                  style={{ paddingLeft: 38 }}
                  required
                />
              </div>
            </div>

            <div className="form-group login-form-group">
              <label className="form-label">{t("password")}</label>
              <div style={{ position: "relative" }}>
                <Lock
                  size={15}
                  style={{
                    position: "absolute",
                    left: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-secondary)",
                    pointerEvents: "none",
                  }}
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    lang === "en" ? "Enter your password" : "パスワードを入力"
                  }
                  autoComplete="current-password"
                  style={{ paddingLeft: 38 }}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{
                width: "100%",
                padding: "13px",
                marginTop: 8,
                fontSize: 15,
                borderRadius: 12,
                justifyContent: "center",
              }}
              disabled={loading}
            >
              {loading ? t("signingIn") : t("signIn")}
            </button>
          </form>

          <div style={{ marginTop: 20, textAlign: "center" }}>
            <button
              onClick={toggle}
              style={{
                background: "none",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "6px 16px",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text-secondary)",
              }}
            >
              {lang === "en" ? "日本語" : "English"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
