import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import gsap from "gsap";
import { api } from "../lib/api";
import { useLang } from "../lib/i18n";
import {
  Building2,
  Package,
  Clock,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Activity,
  RefreshCw,
} from "lucide-react";

const STATUS_COLORS = {
  pending: { bg: "rgba(255,204,122,0.12)", text: "#FFCC7A" },
  approved: { bg: "rgba(94,232,160,0.12)", text: "#5EE8A0" },
  rejected: { bg: "rgba(255,107,107,0.12)", text: "#FF6B6B" },
  delivered: { bg: "rgba(184,176,255,0.12)", text: "#B8B0FF" },
};

function getLast6Months() {
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
    );
  }
  return months;
}

function MonthLabel(ym) {
  const [y, m] = ym.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleString("en", {
    month: "short",
  });
}

function ComparisonChart({ monthlyData }) {
  const [hovered, setHovered] = useState(null);
  const CHART_H = 140;
  const BAR_W = 20;
  const GAP = 8;
  const GRP_GAP = 26;

  const maxVal = Math.max(
    ...monthlyData.map((d) => d.totalRequests),
    ...monthlyData.map((d) => d.totalRestocks),
    1,
  );
  const totalWidth = monthlyData.length * (BAR_W * 2 + GAP + GRP_GAP);

  return (
    <div>
      <svg
        width="100%"
        viewBox={`0 0 ${totalWidth} ${CHART_H + 44}`}
        style={{ display: "block", minWidth: totalWidth }}
      >
        {/* Subtle grid */}
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line
            key={f}
            x1={0}
            y1={CHART_H - f * CHART_H}
            x2={totalWidth}
            y2={CHART_H - f * CHART_H}
            stroke="rgba(255,255,255,0.04)"
            strokeWidth={1}
          />
        ))}

        {monthlyData.map((d, i) => {
          const x = i * (BAR_W * 2 + GAP + GRP_GAP) + GRP_GAP / 2;
          const reqH = (d.totalRequests / maxVal) * CHART_H;
          const resH = (d.totalRestocks / maxVal) * CHART_H;
          const isHov = hovered === i;

          return (
            <g
              key={d.month}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: "pointer" }}
            >
              {/* Hover bg */}
              {isHov && (
                <rect
                  x={x - 5}
                  y={0}
                  width={BAR_W * 2 + GAP + 10}
                  height={CHART_H + 30}
                  fill="rgba(255,255,255,0.03)"
                  rx={8}
                />
              )}

              {/* Requests bar */}
              <rect
                x={x}
                y={CHART_H - reqH}
                width={BAR_W}
                height={reqH}
                rx={5}
                fill={isHov ? "#B8B0FF" : "rgba(184,176,255,0.5)"}
                style={{ transition: "fill 0.15s" }}
              />

              {/* Restocks bar */}
              <rect
                x={x + BAR_W + GAP}
                y={CHART_H - resH}
                width={BAR_W}
                height={resH}
                rx={5}
                fill={isHov ? "#8EC8FF" : "rgba(142,200,255,0.4)"}
                style={{ transition: "fill 0.15s" }}
              />

              {/* Hover value labels */}
              {isHov && reqH > 0 && (
                <text
                  x={x + BAR_W / 2}
                  y={CHART_H - reqH - 6}
                  textAnchor="middle"
                  fill="#B8B0FF"
                  fontSize={10}
                  fontWeight={700}
                >
                  {d.totalRequests}
                </text>
              )}
              {isHov && resH > 0 && (
                <text
                  x={x + BAR_W + GAP + BAR_W / 2}
                  y={CHART_H - resH - 6}
                  textAnchor="middle"
                  fill="#8EC8FF"
                  fontSize={10}
                  fontWeight={700}
                >
                  {d.totalRestocks}
                </text>
              )}

              {/* Month label */}
              <text
                x={x + BAR_W + GAP / 2}
                y={CHART_H + 18}
                textAnchor="middle"
                fill="#3A3A4A"
                fontSize={11}
                fontWeight={600}
              >
                {MonthLabel(d.month)}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div style={{ display: "flex", gap: 18, marginTop: 4 }}>
        <LegendDot color="#B8B0FF" label="Requests" />
        <LegendDot color="#8EC8FF" label="Restocks" />
      </div>
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontSize: 11,
        color: "var(--text-secondary)",
      }}
    >
      <div
        style={{ width: 8, height: 8, borderRadius: 2, background: color }}
      />
      {label}
    </div>
  );
}

export default function Dashboard() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [clinics, setClinics] = useState([]);
  const [requests, setRequests] = useState([]);
  const [overallStats, setOverallStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState([]);
  const [chartLoading, setChartLoading] = useState(true);
  const containerRef = useRef(null);

  function load() {
    setLoading(true);
    Promise.all([
      api.getClinics(),
      api.getRestockRequests(),
      api.getAnalytics(null, null, true),
    ])
      .then(([c, r, a]) => {
        setClinics(c.clinics);
        setRequests(r.requests);
        setOverallStats(a.data);
      })
      .finally(() => setLoading(false));
  }

  function loadChart() {
    const months = getLast6Months();
    setChartLoading(true);
    Promise.all(
      months.map((m) =>
        api
          .getAnalytics(m)
          .then((d) => ({ month: m, ...d.data }))
          .catch(() => ({ month: m, totalRequests: 0, totalRestocks: 0 })),
      ),
    )
      .then(setMonthlyData)
      .finally(() => setChartLoading(false));
  }

  useEffect(() => { load(); }, []);
  useEffect(() => { loadChart(); }, []);

  useEffect(() => {
    if (loading || !containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from(".stat-card", {
        y: 16,
        opacity: 0,
        stagger: 0.07,
        duration: 0.4,
        ease: "power2.out",
      });
      gsap.from(".dash-overview", {
        x: -24,
        opacity: 0,
        duration: 0.5,
        ease: "power2.out",
        delay: 0.2,
      });
      gsap.from(".dash-chart", {
        x: 24,
        opacity: 0,
        duration: 0.5,
        ease: "power2.out",
        delay: 0.2,
      });
      gsap.from(".dash-table", {
        y: 24,
        opacity: 0,
        duration: 0.5,
        ease: "power2.out",
        delay: 0.35,
      });
    }, containerRef);
    return () => ctx.revert();
  }, [loading]);

  const pending = requests.filter((r) => r.status === "pending").length;
  const approved = requests.filter((r) => r.status === "approved").length;
  const delivered = requests.filter((r) => r.status === "delivered").length;
  const totalItems = clinics.reduce((s, c) => s + Number(c.item_count), 0);

  const txTotalCost = overallStats ? Number(overallStats.totalStockCost) : 0;
  const txTotalUnits = overallStats ? Number(overallStats.totalStockQty) : 0;
  const txUsedUnits = overallStats ? Number(overallStats.totalUsedQty) : 0;
  const txUsagePct = overallStats ? Number(overallStats.usagePercentage) : 0;

  const fmtVal = (n) => {
    const v = Number(n);
    return isNaN(v) ? "0" : v.toLocaleString();
  };

  const STATS = [
    {
      label: t("totalClinics"),
      value: clinics.length,
      Icon: Building2,
      iconColor: "#B8B0FF",
      onClick: () => navigate("/clinics"),
    },
    {
      label: t("totalItems"),
      value: totalItems.toLocaleString(),
      Icon: Package,
      iconColor: "#8EC8FF",
      onClick: () => navigate("/items"),
    },
    {
      label: t("pendingRequests"),
      value: pending,
      Icon: Clock,
      iconColor: "#FFCC7A",
      onClick: () => navigate("/restock"),
    },
    {
      label: t("totalStockValue"),
      value: `¥${fmtVal(txTotalCost)}`,
      Icon: TrendingUp,
      iconColor: "#5EE8A0",
      onClick: null,
    },
  ];

  if (loading)
    return (
      <div
        className="loading"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: "50%",
            border: "2px solid #B8B0FF",
            borderTopColor: "transparent",
            animation: "spin 0.7s linear infinite",
          }}
        />
        {t("loading")}
      </div>
    );

  return (
    <div ref={containerRef}>
      {/* ══ ROW 1: Stat cards ══ */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <button
          className="btn-secondary"
          style={{ padding: "6px 12px", display: "flex", alignItems: "center", gap: 6 }}
          onClick={() => { load(); loadChart(); }}
          disabled={loading}
        >
          <RefreshCw size={13} style={loading ? { animation: "spin 0.7s linear infinite" } : {}} />
          {t("refresh")}
        </button>
      </div>
      <div className="stat-grid">
        {STATS.map(({ label, value, Icon, iconColor, onClick }) => (
          <div
            key={label}
            className="stat-card"
            onClick={onClick ?? undefined}
            style={onClick ? { cursor: "pointer" } : {}}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span className="stat-label">{label}</span>
              <Icon
                size={15}
                color={iconColor}
                style={{ opacity: 0.6, flexShrink: 0 }}
              />
            </div>
            <div className="stat-value">{value}</div>
            {onClick && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 11,
                  color: "var(--text-secondary)",
                  marginTop: 2,
                }}
              >
                View <ArrowRight size={10} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ══ ROW 2: Overview card + Chart ══ */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "340px minmax(0, 1fr)",
          gap: 14,
          marginBottom: 14,
        }}
      >
        {/* Overview card */}
        <div
          className="dash-overview"
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
                "radial-gradient(circle, rgba(184,176,255,0.08) 0%, transparent 70%)",
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
              style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}
            >
              Stock Overview
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

          {/* Big number */}
          <div>
            <div
              style={{
                fontSize: 42,
                fontWeight: 900,
                color: "var(--text)",
                lineHeight: 1,
                letterSpacing: "-1px",
              }}
            >
              ¥
              {txTotalCost >= 1000000
                ? `${(txTotalCost / 1000000).toFixed(1)}M`
                : txTotalCost >= 1000
                  ? `${(txTotalCost / 1000).toFixed(1)}K`
                  : fmtVal(txTotalCost)}
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
              Total Stock Value (All-Time)
            </div>
          </div>

          {/* Mini stats row */}
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
                label: "Stock Units",
                value: fmtVal(txTotalUnits),
                color: "#B8B0FF",
              },
              {
                label: "Used Units",
                value: fmtVal(txUsedUnits),
                color: "#FF8C69",
              },
              { label: "Usage", value: `${txUsagePct}%`, color: "#5EE8A0" },
            ].map((s, idx) => (
              <div
                key={s.label}
                style={{
                  flex: 1,
                  paddingLeft: idx === 0 ? 0 : 14,
                  borderLeft: idx === 0 ? "none" : "1px solid var(--border)",
                }}
              >
                <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>
                  {s.value}
                </div>
                <div
                  style={{
                    fontSize: 11,
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

          {/* Status pills */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              {
                label: "Pending",
                count: pending,
                bg: "rgba(255,204,122,0.1)",
                color: "#FFCC7A",
                dot: "#FFCC7A",
              },
              {
                label: "Approved",
                count: approved,
                bg: "rgba(94,232,160,0.1)",
                color: "#5EE8A0",
                dot: "#5EE8A0",
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
                  background: p.bg,
                  border: `1px solid ${p.dot}22`,
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
                    background: p.dot,
                  }}
                />
                {p.count} {p.label}
              </div>
            ))}
          </div>
        </div>

        {/* Monthly comparison chart */}
        <div
          className="dash-chart"
          style={{
            background: "var(--surface)",
            borderRadius: "var(--radius)",
            padding: "22px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
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
                style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}
              >
                Monthly Comparison
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
                Requests vs Restocks — last 6 months
              </div>
            </div>
            <Link to="/analytics">
              <button
                className="btn-ghost"
                style={{ padding: "5px 12px", fontSize: 11 }}
              >
                View All <ArrowRight size={12} />
              </button>
            </Link>
          </div>

          <div style={{ flex: 1 }}>
            {chartLoading ? (
              <div
                style={{
                  height: 160,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-secondary)",
                  fontSize: 12,
                }}
              >
                Loading…
              </div>
            ) : (
              <ComparisonChart monthlyData={monthlyData} />
            )}
          </div>
        </div>
      </div>

      {/* ══ Alert banner ══ */}
      {approved > 0 && (
        <div className="alert-banner">
          <AlertTriangle size={15} />
          <span>
            <strong>{approved}</strong> {t("awaitingDelivery")}
          </span>
          <Link
            to="/restock"
            style={{
              marginLeft: "auto",
              color: "var(--amber)",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 13,
            }}
          >
            {t("viewAll")} <ArrowRight size={13} />
          </Link>
        </div>
      )}

      {/* ══ ROW 3: Recent requests table ══ */}
      <div className="section-header">
        <span className="section-title">{t("recentRestockRequests")}</span>
        <Link to="/restock">
          <button
            className="btn-ghost"
            style={{ padding: "6px 14px", fontSize: 12 }}
          >
            {t("viewAll")} <ArrowRight size={13} />
          </button>
        </Link>
      </div>

      <div className="table-wrap dash-table">
        {requests.length === 0 ? (
          <div className="empty-state">
            <CheckCircle size={36} color="var(--text-muted)" />
            <span>{t("noRestockRequests")}</span>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>{t("item")}</th>
                <th>{t("clinic")}</th>
                <th style={{ textAlign: "center" }}>{t("qty")}</th>
                <th>{t("status")}</th>
                <th>{t("date")}</th>
              </tr>
            </thead>
            <tbody>
              {requests.slice(0, 8).map((r) => {
                const sc = STATUS_COLORS[r.status] ?? {};
                return (
                  <tr key={r.id}>
                    <td>
                      <div
                        style={{
                          fontWeight: 600,
                          color: "var(--text)",
                          fontSize: 13,
                        }}
                      >
                        {r.item_name}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--text-secondary)",
                          marginTop: 2,
                        }}
                      >
                        {r.category}
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          fontWeight: 600,
                          color: "var(--accent)",
                          fontSize: 13,
                        }}
                      >
                        {r.clinic_name}
                      </span>
                    </td>
                    <td
                      style={{
                        textAlign: "center",
                        fontWeight: 700,
                        fontSize: 14,
                      }}
                    >
                      {r.requested_quantity}
                    </td>
                    <td>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          padding: "4px 10px",
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 600,
                          background: sc.bg,
                          color: sc.text,
                        }}
                      >
                        <span
                          style={{
                            width: 5,
                            height: 5,
                            borderRadius: "50%",
                            background: sc.text,
                            display: "inline-block",
                          }}
                        />
                        {t(r.status)}
                      </span>
                    </td>
                    <td
                      style={{ color: "var(--text-secondary)", fontSize: 12 }}
                    >
                      {new Date(r.requested_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
