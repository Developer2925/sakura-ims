import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import gsap from "gsap";
import { api } from "../lib/api";
import { useLang } from "../lib/i18n";
import {
  ArrowLeft,
  Building2,
  Mail,
  Package,
  TrendingUp,
  Layers,
  AlertTriangle,
} from "lucide-react";

const LOW_STOCK = 100;

// ── Main ───────────────────────────────────────────────────────────────────────
export default function ClinicDetail() {
  const { id } = useParams();
  const { t } = useLang();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const containerRef = useRef(null);

  useEffect(() => {
    api
      .getClinicInventory(id)
      .then(setData)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!data || !containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from(".detail-header", {
        y: -20,
        opacity: 0,
        duration: 0.4,
        ease: "power2.out",
      });
      gsap.from(".detail-stat", {
        y: 20,
        opacity: 0,
        stagger: 0.07,
        duration: 0.45,
        ease: "power2.out",
        delay: 0.15,
      });
      gsap.from(".detail-table-wrap", {
        y: 24,
        opacity: 0,
        duration: 0.5,
        ease: "power2.out",
        delay: 0.3,
      });
    }, containerRef);
    return () => ctx.revert();
  }, [data]);

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
  if (!data) return <div className="loading">{t("noData")}</div>;

  const { clinic, items } = data;
  const clinicName = clinic.name || `${clinic.first_name ?? ""} ${clinic.last_name ?? ""}`.trim();
  const positionLabel = clinic.position === "office_staff" ? "Office Staff" : clinic.position === "clinic" ? "Clinic Staff" : null;
  const positionColor = clinic.position === "office_staff" ? { bg: "rgba(142,200,255,0.12)", color: "#8EC8FF" } : { bg: "rgba(94,232,160,0.12)", color: "#5EE8A0" };
  const totalValue = items.reduce((s, i) => s + Number(i.total_price), 0);
  const lowStockCount = items.filter((i) => i.quantity <= LOW_STOCK).length;
  const filtered = items.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.category.toLowerCase().includes(search.toLowerCase()),
  );

  const CLINIC_STATS = [
    {
      label: t("totalItems"),
      value: items.length,
      Icon: Package,
      color: "#B8B0FF",
      bg: "rgba(184,176,255,0.1)",
    },
    {
      label: t("totalStock"),
      value: items.reduce((s, i) => s + i.quantity, 0),
      Icon: Layers,
      color: "#8EC8FF",
      bg: "rgba(142,200,255,0.1)",
    },
    {
      label: t("lowStock"),
      value: lowStockCount,
      Icon: AlertTriangle,
      color: "#FFCC7A",
      bg: "rgba(255,204,122,0.1)",
    },
    {
      label: t("totalStockValue"),
      value: `¥${totalValue.toLocaleString()}`,
      Icon: TrendingUp,
      color: "#5EE8A0",
      bg: "rgba(94,232,160,0.1)",
    },
  ];

  return (
    <div ref={containerRef}>
      {/* Header */}
      <div
        className="detail-header"
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 24,
          gap: 16,
          width: "70vw",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
          <button
            onClick={() => navigate("/clinics")}
            className="btn-secondary"
            style={{ padding: "9px 14px", marginTop: 2 }}
          >
            <ArrowLeft size={15} />
          </button>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: "rgba(184,176,255,0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Building2 size={20} color="#B8B0FF" />
              </div>
              <div>
                <h1
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: "var(--text)",
                    letterSpacing: "-0.4px",
                    lineHeight: 1.2,
                  }}
                >
                  {clinicName}
                </h1>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                    {clinic.first_name} {clinic.last_name}
                  </div>
                  {positionLabel && (
                    <span style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "2px 8px",
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
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                marginTop: 14,
              }}
            >
              {clinic.email && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                    color: "var(--text-secondary)",
                  }}
                >
                  <Mail size={13} />
                  <a
                    href={`mailto:${clinic.email}`}
                    style={{ color: "var(--accent-2)" }}
                  >
                    {clinic.email}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
          marginBottom: 24,
        }}
      >
        {CLINIC_STATS.map(({ label, value, Icon, color, bg }) => (
          <div
            key={label}
            className="detail-stat"
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
      <div style={{ marginBottom: 16 }}>
        <input
          placeholder={t("searchItems")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 360 }}
        />
      </div>

      {/* Table */}
      <div className="detail-table-wrap card" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>{t("itemName")}</th>
              <th>{t("category")}</th>
              <th>{t("price")}</th>
              <th style={{ textAlign: "center" }}>{t("qty")}</th>
              <th>{t("totalValue")}</th>
              <th>{t("expiry")}</th>
              <th>{t("stockedDate")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => {
              const hasBatches = item.batches && item.batches.length > 0;
              return (
                <React.Fragment key={item.id}>
                  <tr>
                    <td>
                      <div style={{ fontWeight: 700 }}>{item.name}</div>
                      {item.manufacturer && (
                        <div
                          style={{
                            fontSize: 12,
                            color: "var(--text-secondary)",
                          }}
                        >
                          {item.manufacturer}
                        </div>
                      )}
                    </td>
                    <td style={{ color: "var(--text-secondary)" }}>
                      {item.category}
                    </td>
                    <td
                      style={{ color: "var(--text-secondary)", fontSize: 12 }}
                    >
                      {hasBatches ? (
                        <span style={{ fontStyle: "italic" }}>
                          {item.batches.length} batch
                          {item.batches.length > 1 ? "es" : ""}
                        </span>
                      ) : (
                        `¥${Number(item.price).toFixed(2)}`
                      )}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span
                        style={{
                          fontWeight: 700,
                          color:
                            item.quantity <= LOW_STOCK
                              ? "var(--amber)"
                              : "var(--text)",
                        }}
                      >
                        {item.quantity}
                        {item.quantity <= LOW_STOCK && (
                          <span
                            style={{
                              marginLeft: 4,
                              fontSize: 10,
                              background: "var(--amber-light)",
                              color: "var(--amber)",
                              padding: "1px 5px",
                              borderRadius: 4,
                            }}
                          >
                            LOW
                          </span>
                        )}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: "var(--accent)" }}>
                      ¥{Number(item.total_price).toFixed(2)}
                    </td>
                    <td
                      style={{ color: "var(--text-secondary)", fontSize: 12 }}
                    >
                      {hasBatches
                        ? "—"
                        : item.expiry_date
                          ? item.expiry_date.slice(0, 10)
                          : "—"}
                    </td>
                    <td
                      style={{
                        fontSize: 11,
                        color: "var(--text-secondary)",
                      }}
                    >
                      {!hasBatches
                        ? item.created_at
                          ? new Date(item.created_at).toLocaleDateString()
                          : "—"
                        : "—"}
                    </td>
                  </tr>
                  {hasBatches &&
                    item.batches.map((batch, bi) => (
                      <tr
                        key={`batch-${batch.id}`}
                        style={{
                          background: "var(--surface-alt, rgba(0,0,0,0.03))",
                        }}
                      >
                        <td
                          style={{
                            paddingLeft: 32,
                            fontSize: 12,
                            color: "var(--text-secondary)",
                          }}
                        >
                          ↳ Batch {bi + 1}
                          {batch.condition_status &&
                            batch.condition_status !== "新品" && (
                              <span
                                style={{
                                  marginLeft: 6,
                                  fontSize: 10,
                                  color: "var(--amber)",
                                }}
                              >
                                {batch.condition_status}
                              </span>
                            )}
                        </td>
                        <td />
                        <td style={{ fontSize: 12, fontWeight: 600 }}>
                          ¥{Number(batch.price).toFixed(2)}
                        </td>
                        <td style={{ textAlign: "center", fontSize: 12 }}>
                          {batch.quantity}
                        </td>
                        <td style={{ fontSize: 12, color: "var(--accent)" }}>
                          ¥{(Number(batch.price) * batch.quantity).toFixed(2)}
                        </td>
                        <td
                          style={{
                            fontSize: 12,
                            color: "var(--text-secondary)",
                          }}
                        >
                          {batch.expiry_date
                            ? batch.expiry_date.slice(0, 10)
                            : "—"}
                        </td>
                        <td
                          style={{
                            fontSize: 11,
                            color: "var(--text-secondary)",
                          }}
                        >
                          {batch.created_at
                            ? new Date(batch.created_at).toLocaleDateString()
                            : "—"}
                        </td>
                      </tr>
                    ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="empty-state">{t("noItemsFound")}</div>
        )}
      </div>
    </div>
  );
}
