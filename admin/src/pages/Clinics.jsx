import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import { api } from "../lib/api";
import { useLang } from "../lib/i18n";
import {
  Building2,
  ChevronRight,
  Layers,
  Eye,
  EyeOff,
  TrendingUp,
  Package,
  RefreshCw,
} from "lucide-react";


// ── Password Cell ─────────────────────────────────────────────────────────────
function PasswordCell({ value }) {
  const { t } = useLang();
  const [visible, setVisible] = useState(false);
  if (!value)
    return (
      <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>
        {t("notSet")}
      </span>
    );
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span
        style={{
          fontFamily: "monospace",
          fontSize: 13,
          color: visible ? "var(--text)" : "var(--text-secondary)",
          letterSpacing: visible ? "normal" : "0.1em",
          userSelect: visible ? "text" : "none",
          width: 60,
        }}
      >
        {visible ? value : "••••••••"}
      </span>
      <button
        onClick={() => setVisible((v) => !v)}
        style={{
          background: "none",
          border: "none",
          padding: "3px",
          cursor: "pointer",
          color: "var(--text-secondary)",
          borderRadius: 6,
          display: "flex",
        }}
        title={visible ? "Hide" : "Reveal"}
      >
        {visible ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  );
}

// ── Main Clinics Page ─────────────────────────────────────────────────────────
export default function Clinics() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [positionFilter, setPositionFilter] = useState("all");
  const containerRef = useRef(null);

  function load() {
    setLoading(true);
    api
      .getClinics()
      .then((d) => setClinics(d.clinics))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!clinics.length || !containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from(".clinics-header", {
        y: -20,
        opacity: 0,
        duration: 0.4,
        ease: "power2.out",
      });
      gsap.from(".clinic-card", {
        y: 28,
        opacity: 0,
        stagger: 0.07,
        duration: 0.45,
        ease: "power2.out",
        delay: 0.1,
      });
    }, containerRef);
    return () => ctx.revert();
  }, [clinics]);

  const filtered = clinics.filter((c) => {
    const q = search.toLowerCase();
    const matchesSearch =
      (c.name || "").toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q) ||
      (c.first_name || "").toLowerCase().includes(q) ||
      (c.last_name || "").toLowerCase().includes(q);
    const matchesPosition =
      positionFilter === "all" || c.position === positionFilter;
    return matchesSearch && matchesPosition;
  });

  if (loading)
    return (
      <div
        className="loading"
        style={{ display: "flex", alignItems: "center", gap: 10 }}
      >
        <div
          style={{
            width: 16,
            height: 16,
            borderRadius: "50%",
            border: "2px solid var(--accent)",
            borderTopColor: "transparent",
            animation: "spin 0.7s linear infinite",
          }}
        />
        {t("loading")}
      </div>
    );

  return (
    <div ref={containerRef}>
      {/* Header */}
      <div className="clinics-header page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title">{t("clinicList")}</h1>
          <div
            style={{
              fontSize: 13,
              color: "var(--text-secondary)",
              marginTop: 2,
            }}
          >
            {filtered.length} {t("clinics")}
          </div>
        </div>
        <button
          className="btn-secondary"
          style={{ padding: "6px 12px", display: "flex", alignItems: "center", gap: 6 }}
          onClick={load}
          disabled={loading}
        >
          <RefreshCw size={13} style={loading ? { animation: "spin 0.7s linear infinite" } : {}} />
          {t("refresh")}
        </button>
      </div>

      {/* Position filter + Search */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { key: "all", label: t("allUsers") },
          { key: "clinic", label: t("clinicStaff") },
          { key: "office_staff", label: t("officeStaff") },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setPositionFilter(key)}
            style={{
              padding: "6px 16px",
              borderRadius: 20,
              border: "1.5px solid",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s",
              borderColor: positionFilter === key ? "var(--accent)" : "var(--border)",
              background: positionFilter === key ? "var(--accent-dim)" : "transparent",
              color: positionFilter === key ? "var(--accent)" : "var(--text-secondary)",
            }}
          >
            {label}
            <span style={{
              marginLeft: 6,
              fontSize: 11,
              background: positionFilter === key ? "var(--accent)" : "var(--surface-2)",
              color: positionFilter === key ? "var(--bg)" : "var(--text-secondary)",
              borderRadius: 10,
              padding: "1px 6px",
            }}>
              {key === "all"
                ? clinics.length
                : clinics.filter((c) => c.position === key).length}
            </span>
          </button>
        ))}
        <input
          placeholder={t("searchClinics")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, maxWidth: 360 }}
        />
      </div>

      {/* Card grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
        }}
      >
        {filtered.map((clinic) => {
          const name = clinic.name || `${clinic.first_name ?? ""} ${clinic.last_name ?? ""}`.trim();
          const positionLabel = clinic.position === "office_staff" ? "Office Staff" : clinic.position === "clinic" ? "Clinic Staff" : null;
          const positionColor = clinic.position === "office_staff" ? { bg: "rgba(142,200,255,0.12)", color: "#8EC8FF" } : { bg: "rgba(94,232,160,0.12)", color: "#5EE8A0" };
          const value = Number(clinic.total_value);

          return (
            <div
              key={clinic.id}
              className="clinic-card"
              style={{
                background: "var(--surface)",
                borderRadius: "var(--radius)",
                padding: 20,
                display: "flex",
                flexDirection: "column",
                gap: 16,
                cursor: "pointer",
              }}
              onClick={() => navigate(`/clinics/${clinic.id}`)}
            >
              {/* Clinic name + actions */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      background: "rgba(184,176,255,0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Building2 size={20} color="#B8B0FF" />
                  </div>
                  <div>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 15,
                        color: "var(--text)",
                      }}
                    >
                      {name}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                      <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                        {clinic.first_name} {clinic.last_name}
                      </div>
                      {positionLabel && (
                        <span style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "2px 7px",
                          borderRadius: 6,
                          background: positionColor.bg,
                          color: positionColor.color,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}>
                          {positionLabel}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Credentials */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {clinic.email ? (
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text-secondary)",
                      background: "var(--surface-2)",
                      borderRadius: 8,
                      padding: "4px 10px",
                    }}
                  >
                    {clinic.email}
                  </div>
                ) : (
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--red)",
                      background: "var(--red-light)",
                      borderRadius: 8,
                      padding: "4px 10px",
                    }}
                  >
                    {t("notSet")}
                  </div>
                )}
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    fontSize: 12,
                    background: "var(--surface-2)",
                    borderRadius: 8,
                    padding: "3px 8px 3px 10px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <PasswordCell value={clinic.plain_password} />
                </div>
              </div>

              {/* Stats row */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 8,
                }}
              >
                {[
                  {
                    label: t("items"),
                    value: Number(clinic.item_count),
                    Icon: Package,
                    color: "#B8B0FF",
                    bg: "rgba(184,176,255,0.08)",
                  },
                  {
                    label: t("stock"),
                    value: Number(clinic.total_quantity),
                    Icon: Layers,
                    color: "#8EC8FF",
                    bg: "rgba(142,200,255,0.08)",
                  },
                  {
                    label: t("value"),
                    value: `¥${value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value.toLocaleString()}`,
                    Icon: TrendingUp,
                    color: "#5EE8A0",
                    bg: "rgba(94,232,160,0.08)",
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    style={{
                      background: "var(--surface-2)",
                      borderRadius: 10,
                      padding: "10px 12px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        background: s.bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <s.Icon size={13} color={s.color} />
                    </div>
                    <div
                      style={{ fontSize: 16, fontWeight: 800, color: s.color }}
                    >
                      {s.value}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "var(--text-secondary)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* View detail link */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: 4,
                  fontSize: 12,
                  color: "var(--text-secondary)",
                }}
              >
                {t("viewDetails")} <ChevronRight size={14} />
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">{t("noClinicsFound")}</div>
      )}

    </div>
  );
}
