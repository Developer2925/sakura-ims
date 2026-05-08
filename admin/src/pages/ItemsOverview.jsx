import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import { api } from "../lib/api";
import { useLang } from "../lib/i18n";
import {
  ArrowLeft,
  Building2,
  Package,
  Layers,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

const LOW_STOCK_THRESHOLD = 100;

export default function ItemsOverview() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const containerRef = useRef(null);

  function load() {
    setLoading(true);
    api
      .getClinics()
      .then((d) => setClinics(d.clinics))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!clinics.length || !containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from(".items-header", {
        y: -20,
        opacity: 0,
        duration: 0.4,
        ease: "power2.out",
      });
      gsap.from(".items-summary-card", {
        y: 20,
        opacity: 0,
        stagger: 0.07,
        duration: 0.4,
        ease: "power2.out",
        delay: 0.1,
      });
      gsap.from(".clinic-items-card", {
        y: 28,
        opacity: 0,
        stagger: 0.06,
        duration: 0.45,
        ease: "power2.out",
        delay: 0.25,
      });
    }, containerRef);
    return () => ctx.revert();
  }, [clinics]);

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

  const totalItems = clinics.reduce((s, c) => s + Number(c.item_count), 0);
  const totalStock = clinics.reduce((s, c) => s + Number(c.total_quantity), 0);
  const totalValue = clinics.reduce((s, c) => s + Number(c.total_value), 0);

  const filtered = clinics.filter((c) => {
    const q = search.toLowerCase();
    return (
      (c.name || "").toLowerCase().includes(q) ||
      (c.username || "").toLowerCase().includes(q) ||
      (c.first_name || "").toLowerCase().includes(q) ||
      (c.last_name || "").toLowerCase().includes(q)
    );
  });

  const SUMMARY = [
    {
      label: t("totalClinics"),
      value: clinics.length,
      Icon: Building2,
      color: "#B8B0FF",
      bg: "rgba(184,176,255,0.1)",
    },
    {
      label: t("totalItems"),
      value: totalItems,
      Icon: Package,
      color: "#8EC8FF",
      bg: "rgba(142,200,255,0.1)",
    },
    {
      label: t("totalStock"),
      value: totalStock.toLocaleString(),
      Icon: Layers,
      color: "#5EE8A0",
      bg: "rgba(94,232,160,0.1)",
    },
    {
      label: t("totalStockValue"),
      value: `¥${totalValue.toLocaleString()}`,
      Icon: TrendingUp,
      color: "#FFCC7A",
      bg: "rgba(255,204,122,0.1)",
    },
  ];

  return (
    <div ref={containerRef}>
      {/* Header */}
      <div
        className="items-header"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 24,
        }}
      >
        <button
          className="btn-secondary"
          style={{ padding: "9px 14px" }}
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft size={15} />
        </button>
        <div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: "var(--text)",
              letterSpacing: "-0.4px",
            }}
          >
            {t("totalItems")}
          </h1>
          <div
            style={{
              fontSize: 13,
              color: "var(--text-secondary)",
              marginTop: 2,
            }}
          >
            {t("stockDetailsPerClinic")}
          </div>
        </div>
        <button
          className="btn-secondary"
          style={{
            marginLeft: "auto",
            padding: "6px 12px",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
          onClick={load}
          disabled={loading}
        >
          <RefreshCw
            size={13}
            style={loading ? { animation: "spin 0.7s linear infinite" } : {}}
          />
          {t("refresh")}
        </button>
      </div>

      {/* Summary row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
          marginBottom: 28,
        }}
      >
        {SUMMARY.map(({ label, value, Icon, color, bg }) => (
          <div
            key={label}
            className="items-summary-card"
            style={{
              background: "var(--surface)",
              borderRadius: "var(--radius)",
              padding: "18px 20px",
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon size={20} color={color} />
            </div>
            <div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: "var(--text)",
                  letterSpacing: "-0.5px",
                }}
              >
                {value}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginTop: 2,
                }}
              >
                {label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom: 18 }}>
        <input
          placeholder={t("searchClinics")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 360 }}
        />
      </div>

      {/* Per-clinic cards grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 14,
        }}
      >
        {filtered.map((clinic) => {
          const name = clinic.name || `${clinic.first_name ?? ""} ${clinic.last_name ?? ""}`.trim();
          const positionLabel = clinic.position === "office_staff" ? "Office Staff" : clinic.position === "clinic" ? "Clinic Staff" : null;
          const positionColor = clinic.position === "office_staff" ? { bg: "rgba(142,200,255,0.12)", color: "#8EC8FF" } : { bg: "rgba(94,232,160,0.12)", color: "#5EE8A0" };
          const items = Number(clinic.item_count);
          const stock = Number(clinic.total_quantity);
          const value = Number(clinic.total_value);
          const stockPct = totalStock > 0 ? (stock / totalStock) * 100 : 0;

          return (
            <div
              key={clinic.id}
              className="clinic-items-card"
              onClick={() => navigate(`/clinics/${clinic.id}`)}
              style={{
                background: "var(--surface)",
                borderRadius: "var(--radius)",
                padding: "20px",
                cursor: "pointer",
              }}
            >
              {/* Clinic name */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: "rgba(184,176,255,0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Building2 size={16} color="#B8B0FF" />
                  </div>
                  <div>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 14,
                        color: "var(--text)",
                      }}
                    >
                      {name}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                      <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                        {clinic.first_name} {clinic.last_name}
                      </div>
                      {positionLabel && (
                        <span style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "1px 6px",
                          borderRadius: 5,
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
                <ChevronRight size={16} color="var(--text-secondary)" />
              </div>

              {/* Stats row */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 8,
                  marginBottom: 16,
                }}
              >
                {[
                  { label: t("items"), value: items, color: "#B8B0FF" },
                  {
                    label: t("stock"),
                    value: stock.toLocaleString(),
                    color: "#8EC8FF",
                  },
                  {
                    label: t("value"),
                    value: `¥${value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value.toLocaleString()}`,
                    color: "#5EE8A0",
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    style={{
                      background: "var(--surface-2)",
                      borderRadius: 10,
                      padding: "10px 12px",
                    }}
                  >
                    <div
                      style={{ fontSize: 15, fontWeight: 800, color: s.color }}
                    >
                      {s.value}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "var(--text-secondary)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        marginTop: 2,
                      }}
                    >
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Stock share bar */}
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 6,
                    fontSize: 11,
                    color: "var(--text-secondary)",
                  }}
                >
                  <span>{t("stockShare")}</span>
                  <span style={{ fontWeight: 700, color: "var(--text)" }}>
                    {stockPct.toFixed(1)}%
                  </span>
                </div>
                <div
                  style={{
                    height: 4,
                    borderRadius: 2,
                    background: "var(--surface-2)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${stockPct}%`,
                      background: "linear-gradient(90deg, #B8B0FF, #8EC8FF)",
                      borderRadius: 2,
                      transition: "width 0.6s ease",
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <AlertTriangle size={36} color="var(--text-muted)" />
          <span>{t("noClinicsFound")}</span>
        </div>
      )}
    </div>
  );
}
