import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import { useLang } from "../lib/i18n";
import gsap from "gsap";
import {
  BarChart3,
  Package,
  TrendingDown,
  TrendingUp,
  Activity,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  ChevronDown,
} from "lucide-react";

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function MonthPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const [y, m] = value.split("-").map(Number);
  const [viewYear, setViewYear] = useState(y);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // When value changes externally, sync viewYear
  useEffect(() => {
    setViewYear(Number(value.split("-")[0]));
  }, [value]);

  function selectMonth(monthIdx) {
    onChange(`${viewYear}-${String(monthIdx + 1).padStart(2, "0")}`);
    setOpen(false);
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Trigger */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "var(--surface-2)",
          border: "1px solid var(--border-2)",
          borderRadius: 10,
          padding: "0 14px",
          height: 38,
          cursor: "pointer",
          color: "var(--text)",
          fontSize: 13,
          fontWeight: 700,
          transition: "border-color 0.15s",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.borderColor = "rgba(184,176,255,0.4)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.borderColor = "var(--border-2)")
        }
      >
        <CalendarDays size={14} color="var(--text-secondary)" />
        {MONTH_NAMES[m - 1]} {y}
        <ChevronDown
          size={12}
          color="var(--text-secondary)"
          style={{ marginLeft: 2 }}
        />
      </button>

      {/* Popup */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            zIndex: 1000,
            background: "var(--surface)",
            borderRadius: 14,
            padding: 16,
            width: 260,
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}
        >
          {/* Year nav */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 14,
            }}
          >
            <button
              onClick={() => setViewYear((y) => y - 1)}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-secondary)",
                cursor: "pointer",
                padding: 4,
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--text)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--text-secondary)")
              }
            >
              <ChevronLeft size={16} />
            </button>
            <span
              style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}
            >
              {viewYear}
            </span>
            <button
              onClick={() => setViewYear((y) => y + 1)}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-secondary)",
                cursor: "pointer",
                padding: 4,
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--text)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--text-secondary)")
              }
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Month grid 3x4 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 6,
            }}
          >
            {MONTH_NAMES.map((name, idx) => {
              const isSelected = viewYear === y && idx + 1 === m;
              return (
                <button
                  key={name}
                  onClick={() => selectMonth(idx)}
                  style={{
                    textAlign: "center",
                    justifyContent: "center",
                    borderRadius: 8,
                    border: "none",
                    cursor: "pointer",
                    background: isSelected ? "#FFFFFF" : "transparent",
                    color: isSelected ? "#0D0D0F" : "var(--text-secondary)",
                    fontSize: 12,
                    fontWeight: isSelected ? 700 : 500,
                    transition: "background 0.15s, color 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = "var(--surface-2)";
                      e.currentTarget.style.color = "var(--text)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "var(--text-secondary)";
                    }
                  }}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function getDefaultMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function fmt(n) {
  const v = Number(n);
  return isNaN(v) ? "0" : v.toLocaleString();
}

function CostBar({ label, value, total, color }) {
  const v = Number(value) || 0;
  const t = Number(total) || 0;
  const pct = t > 0 ? Math.min(100, Math.round((v / t) * 100)) : 0;
  return (
    <div style={{ marginBottom: 18 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
          {label}
        </span>
        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: 14, fontWeight: 700, color }}>
            {" "}
            ¥{fmt(v)}
          </span>
          <span
            style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 6 }}
          >
            {pct}%
          </span>
        </div>
      </div>
      <div
        style={{
          height: 5,
          background: "var(--border)",
          borderRadius: 99,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: color,
            borderRadius: 99,
            transition: "width 0.5s ease",
          }}
        />
      </div>
    </div>
  );
}

export default function Analytics() {
  const { t } = useLang();
  const [month, setMonth] = useState(getDefaultMonth());
  const [clinics, setClinics] = useState([]);
  const [clinicId, setClinicId] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !data) return;
    const ctx = gsap.context(() => {
      gsap.from(".analytics-header", {
        y: -16,
        opacity: 0,
        duration: 0.4,
        ease: "power2.out",
        clearProps: "transform",
      });
      gsap.from(".analytics-hero", {
        x: -24,
        opacity: 0,
        duration: 0.45,
        ease: "power2.out",
        delay: 0.1,
      });
      gsap.from(".analytics-cost", {
        x: 24,
        opacity: 0,
        duration: 0.45,
        ease: "power2.out",
        delay: 0.1,
      });
      gsap.from(".analytics-stat", {
        y: 20,
        opacity: 0,
        stagger: 0.06,
        duration: 0.4,
        ease: "power2.out",
        delay: 0.25,
      });
    }, containerRef);
    return () => ctx.revert();
  }, [data]);

  useEffect(() => {
    api.getClinics().then((d) => setClinics(d.clinics));
  }, []);

  useEffect(() => {
    if (!month) return;
    setLoading(true);
    api
      .getAnalytics(month, clinicId || undefined, false)
      .then((d) => setData(d.data))
      .finally(() => setLoading(false));
  }, [month, clinicId]);

  const usagePct = data ? Math.min(Number(data.usagePercentage) || 0, 100) : 0;
  const totalCost = data ? Number(data.totalStockCost) : 0;

  const STATS = data
    ? [
        {
          label: t("totalReceived"),
          value: `${fmt(data.totalStockQty)} ${t("units")}`,
          iconColor: "#FFCC7A",
          Icon: Package,
        },
        {
          label: t("totalStockCost"),
          value: `¥${fmt(data.totalStockCost)}`,
          iconColor: "#B8B0FF",
          Icon: BarChart3,
        },
        {
          label: t("usedQty") + ` (${t("monthly")})`,
          value: `${fmt(data.qtyUsed)} ${t("units")}`,
          iconColor: "#FF8C69",
          Icon: TrendingDown,
        },
        {
          label: t("usedCost") + ` (${t("monthly")})`,
          value: `¥${fmt(data.costUsed)}`,
          iconColor: "#FF6B6B",
          Icon: TrendingDown,
        },
        {
          label: t("remainingStock"),
          value: `${fmt(data.remainingStockQty)} ${t("units")}`,
          iconColor: "#5EE8A0",
          Icon: TrendingUp,
        },
        {
          label: t("totalRequests"),
          value: String(data.totalRequests),
          iconColor: "#8EC8FF",
          Icon: Activity,
        },
      ]
    : [];

  return (
    <div ref={containerRef}>
      {/* ══ Filters bar (compact, inline) ══ */}
      <div
        className="analytics-header"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 18,
          justifyContent: "flex-end",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 3,
            }}
          >
            <label
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "var(--text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {t("month")}
            </label>
            <MonthPicker value={month} onChange={setMonth} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <label
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "var(--text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {t("clinic")}
            </label>
            <select
              value={clinicId}
              onChange={(e) => setClinicId(e.target.value)}
              style={{ width: 220, padding: "7px 12px", fontSize: 13 }}
            >
              <option value="">{t("allClinics")}</option>
              {clinics.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name.split("|")[0]?.trim()}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading && (
        <div
          className="loading"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: "50%",
              border: "2px solid #B8B0FF",
              borderTopColor: "transparent",
              animation: "spin 0.7s linear infinite",
            }}
          />
          {t("loading")}
        </div>
      )}

      {!loading && !data && (
        <div className="empty-state" style={{ marginTop: 40 }}>
          <BarChart3 size={36} color="var(--text-muted)" />
          <span>Select a month to view analytics</span>
        </div>
      )}

      {!loading && data && (
        <>
          {/* ══ ROW 1: Stat cards ══ */}
          <div className="stat-grid" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))", marginBottom: 14 }}>
            {STATS.map(({ label, value, Icon, iconColor }) => (
              <div key={label} className="analytics-stat stat-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="stat-label">{label}</span>
                  <Icon size={15} color={iconColor} style={{ opacity: 0.6, flexShrink: 0 }} />
                </div>
                <div className="stat-value">{value}</div>
              </div>
            ))}
          </div>

          {/* ══ ROW 2: Usage Rate hero + Cost breakdown ══ */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "340px minmax(0, 1fr)",
              gap: 14,
              marginBottom: 14,
            }}
          >
            {/* Usage Rate hero card — mirrors Stock Overview */}
            <div
              className="analytics-hero"
              style={{
                background: "var(--surface)",
                borderRadius: "var(--radius)",
                padding: "28px 26px",
                display: "flex",
                flexDirection: "column",
                gap: 20,
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Decorative glow */}
              <div
                style={{
                  position: "absolute",
                  top: -40,
                  right: -40,
                  width: 180,
                  height: 180,
                  borderRadius: "50%",
                  background:
                    "radial-gradient(circle, rgba(184,176,255,0.07) 0%, transparent 70%)",
                  pointerEvents: "none",
                }}
              />

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "var(--text)",
                  }}
                >
                  {t("usageRate")}
                </div>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: "var(--surface-2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Activity size={15} color="#B8B0FF" />
                </div>
              </div>

              {/* Big percentage */}
              <div>
                <div
                  style={{
                    fontSize: 52,
                    fontWeight: 900,
                    color: "var(--text)",
                    lineHeight: 1,
                    letterSpacing: "-2px",
                  }}
                >
                  {Number(data.usagePercentage) || 0}
                  <span
                    style={{
                      fontSize: 24,
                      fontWeight: 500,
                      color: "var(--text-secondary)",
                      letterSpacing: 0,
                    }}
                  >
                    %
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-secondary)",
                    marginTop: 6,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  {"Stock consumed this month"}
                </div>
              </div>

              {/* Progress bar */}
              <div>
                <div
                  style={{
                    height: 6,
                    background: "var(--border)",
                    borderRadius: 99,
                    overflow: "hidden",
                    marginBottom: 8,
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${usagePct}%`,
                      background: "linear-gradient(90deg, #B8B0FF, #8EC8FF)",
                      borderRadius: 99,
                      transition: "width 0.5s ease",
                    }}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 11,
                    color: "var(--text-secondary)",
                  }}
                >
                  <span>
                    {t("usedLabel")}:{" "}
                    {fmt(data.qtyUsed)}{" "}
                    {t("units")}
                  </span>
                  <span>
                    {t("totalReceived")}: {fmt(data.totalStockQty)} {t("units")}
                  </span>
                </div>
              </div>

              {/* Mini stats */}
              <div
                style={{
                  display: "flex",
                  gap: 0,
                  borderTop: "1px solid var(--border)",
                  paddingTop: 18,
                }}
              >
                {[
                  {
                    label: t("usedLabel"),
                    value: fmt(data.qtyUsed),
                    color: "#B8B0FF",
                  },
                  {
                    label: t("remainingStock"),
                    value: fmt(data.remainingStockQty),
                    color: "#5EE8A0",
                  },
                  {
                    label: t("totalReceived"),
                    value: fmt(data.totalStockQty),
                    color: "#FFCC7A",
                  },
                ].map((s, idx) => (
                  <div
                    key={s.label}
                    style={{
                      flex: 1,
                      paddingLeft: idx === 0 ? 0 : 12,
                      borderLeft:
                        idx === 0 ? "none" : "1px solid var(--border)",
                    }}
                  >
                    <div
                      style={{ fontSize: 16, fontWeight: 800, color: s.color }}
                    >
                      {s.value}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "var(--text-secondary)",
                        marginTop: 2,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cost breakdown card — mirrors the chart card */}
            <div
              className="analytics-cost"
              style={{
                background: "var(--surface)",
                borderRadius: "var(--radius)",
                padding: "22px 24px",
                display: "flex",
                flexDirection: "column",
                gap: 20,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "var(--text)",
                    }}
                  >
                    {t("stockCost")}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-secondary)",
                      marginTop: 3,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Cost distribution for selected period
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 900,
                    color: "var(--text)",
                    textAlign: "right",
                    lineHeight: 1,
                  }}
                >
                  ¥
                  {totalCost >= 1000000
                    ? `${(totalCost / 1000000).toFixed(2)}M`
                    : fmt(totalCost)}
                  <div
                    style={{
                      fontSize: 10,
                      color: "var(--text-secondary)",
                      fontWeight: 400,
                      marginTop: 3,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Total
                  </div>
                </div>
              </div>

              <div style={{ flex: 1, paddingTop: 4 }}>
                <CostBar
                  label={t("totalStockCost")}
                  value={data.totalStockCost}
                  total={data.totalStockCost}
                  color="#B8B0FF"
                />
                <CostBar
                  label={t("usedCost")}
                  value={data.costUsed}
                  total={data.totalStockCost}
                  color="#FF6B6B"
                />
                <CostBar
                  label={t("remainingCost")}
                  value={data.remainingStockCost}
                  total={data.totalStockCost}
                  color="#5EE8A0"
                />
              </div>

              {/* Summary pills — mirrors the pending/approved pills */}
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  borderTop: "1px solid var(--border)",
                  paddingTop: 16,
                }}
              >
                {[
                  {
                    label: "Total Requests",
                    count: data.totalRequests,
                    color: "#B8B0FF",
                  },
                  {
                    label: "Restocks Done",
                    count: data.totalRestocks,
                    color: "#5EE8A0",
                  },
                ].map((p) => (
                  <div
                    key={p.label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      padding: "7px 12px",
                      borderRadius: 24,
                      background: `${p.color}14`,
                      border: `1px solid ${p.color}22`,
                      fontSize: 12,
                      fontWeight: 600,
                      color: p.color,
                    }}
                  >
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: p.color,
                      }}
                    />
                    {p.count} {p.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

        </>
      )}
    </div>
  );
}
