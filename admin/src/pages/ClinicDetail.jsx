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
  ShieldCheck,
  TrendingUp,
  Pencil,
  Send,
  Eye,
  EyeOff,
  CheckCircle,
  Layers,
  AlertTriangle,
} from "lucide-react";

const LOW_STOCK = 100;

// ── Edit Modal ────────────────────────────────────────────────────────────────
function EditModal({ clinic, onClose, onSaved }) {
  const { t } = useLang();
  const [form, setForm] = useState({
    name: clinic.name,
    username: clinic.username,
    email: clinic.email || "",
    password: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(field, val) {
    setForm((f) => ({ ...f, [field]: val }));
    setError("");
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim() || undefined,
        username: form.username.trim() || undefined,
        email: form.email.trim() || "",
        password: form.password || undefined,
      };
      const { clinic: updated } = await api.updateClinic(clinic.id, payload);
      onSaved(updated);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal">
        <h2
          className="modal-title"
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
          <Pencil size={18} /> {t("editClinicCredentials")}
        </h2>
        {[
          ["name", t("clinicName")],
          ["username", t("username")],
          ["email", t("email")],
        ].map(([field, label]) => (
          <div className="form-group" key={field}>
            <label className="form-label">{label}</label>
            <input
              value={form[field]}
              onChange={(e) => set(field, e.target.value)}
              type={field === "email" ? "email" : "text"}
            />
          </div>
        ))}
        <div className="form-group">
          <label className="form-label">
            {t("newPassword")}{" "}
            <span style={{ color: "var(--text-secondary)", fontWeight: 400 }}>
              {t("leaveBlank")}
            </span>
          </label>
          <div className="input-reveal">
            <input
              type={showPw ? "text" : "password"}
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              placeholder={t("enterNewPassword")}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="reveal-btn"
              onClick={() => setShowPw((v) => !v)}
            >
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>
        {error && (
          <div
            style={{
              color: "var(--red)",
              fontSize: 13,
              marginBottom: 12,
              padding: "8px 12px",
              background: "var(--red-light)",
              borderRadius: 8,
            }}
          >
            {error}
          </div>
        )}
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose} disabled={saving}>
            {t("cancel")}
          </button>
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? t("saving") : t("saveChanges")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Send Modal ─────────────────────────────────────────────────────────────────
function SendModal({ clinic, onClose }) {
  const { t } = useLang();
  const [password, setPassword] = useState(clinic.plain_password || "");
  const [showPw, setShowPw] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSend() {
    if (!password.trim()) {
      setError("Password required.");
      return;
    }
    if (!clinic.email) {
      setError(t("noEmailSet"));
      return;
    }
    setSending(true);
    try {
      await api.sendCredentials(clinic.id, password);
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && !sent && onClose()}
    >
      <div className="modal">
        {sent ? (
          <div style={{ textAlign: "center", padding: "12px 0 24px" }}>
            <CheckCircle
              size={48}
              color="var(--green)"
              style={{ margin: "0 auto 12px", display: "block" }}
            />
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>
              {t("credentialsSent")}
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
              {t("loginDetailsEmailed")}
              <br />
              <strong style={{ color: "var(--text)" }}>{clinic.email}</strong>
            </p>
            <div
              className="modal-footer"
              style={{ justifyContent: "center", marginTop: 20 }}
            >
              <button className="btn-primary" onClick={onClose}>
                {t("done")}
              </button>
            </div>
          </div>
        ) : (
          <>
            <h2
              className="modal-title"
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              <Send size={18} /> {t("sendLoginCredentials")}
            </h2>
            <div className="form-group">
              <div className="input-reveal">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder={t("typePassword")}
                  autoFocus
                />
                <button
                  type="button"
                  className="reveal-btn"
                  onClick={() => setShowPw((v) => !v)}
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            {error && (
              <div
                style={{ color: "var(--red)", fontSize: 13, marginBottom: 12 }}
              >
                {error}
              </div>
            )}
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={onClose}
                disabled={sending}
              >
                {t("cancel")}
              </button>
              <button
                className="btn-info"
                onClick={handleSend}
                disabled={sending || !clinic.email}
              >
                {sending ? (
                  t("sending")
                ) : (
                  <>
                    <Send size={13} /> {t("sendEmail")}
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function ClinicDetail() {
  const { id } = useParams();
  const { t } = useLang();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editQty, setEditQty] = useState("");
  const [saving, setSaving] = useState(false);
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

  async function handleSaveQty(item) {
    const qty = parseInt(editQty);
    if (isNaN(qty) || qty < 0) return;
    setSaving(true);
    try {
      await api.updateInventoryItem(id, item.id, qty);
      setData((prev) => ({
        ...prev,
        items: prev.items.map((i) =>
          i.id === item.id
            ? {
                ...i,
                quantity: qty,
                total_price:
                  i.batches && i.batches.length > 0
                    ? i.batches
                        .reduce((s, b) => s + Number(b.price) * b.quantity, 0)
                        .toFixed(2)
                    : (i.price * qty).toFixed(2),
              }
            : i,
        ),
      }));
      setEditingId(null);
    } catch (err) {
      alert(t("updateFailed") + ": " + err.message);
    } finally {
      setSaving(false);
    }
  }

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
  const clinicName = clinic.name.split("|")[0]?.trim();
  const clinicNameEn = clinic.name.split("|")[1]?.trim();
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
                {clinicNameEn && (
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--text-secondary)",
                      marginTop: 2,
                    }}
                  >
                    {clinicNameEn}
                  </div>
                )}
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
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 13,
                  color: "var(--text-secondary)",
                }}
              >
                <ShieldCheck size={13} />
                <span
                  style={{ fontFamily: "monospace", color: "var(--accent)" }}
                >
                  {clinic.username}
                </span>
              </div>
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
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button
            className="btn-ghost"
            style={{ padding: "9px 14px" }}
            onClick={() => setEditOpen(true)}
          >
            <Pencil size={14} /> {t("edit")}
          </button>
          <button
            className="btn-info"
            style={{ padding: "9px 14px" }}
            onClick={() => setSendOpen(true)}
          >
            <Send size={14} /> {t("sendEmail")}
          </button>
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
              <th>
                {t("actions")} / {t("stockedDate")}
              </th>
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
                      {editingId === item.id ? (
                        <input
                          type="number"
                          value={editQty}
                          onChange={(e) => setEditQty(e.target.value)}
                          min="0"
                          style={{ width: 80, padding: "4px 8px" }}
                          autoFocus
                        />
                      ) : (
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
                      )}
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
                    <td>
                      {editingId === item.id ? (
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            className="btn-success"
                            style={{ padding: "5px 12px", fontSize: 12 }}
                            onClick={() => handleSaveQty(item)}
                            disabled={saving}
                          >
                            {t("save")}
                          </button>
                          <button
                            className="btn-secondary"
                            style={{ padding: "5px 12px", fontSize: 12 }}
                            onClick={() => setEditingId(null)}
                          >
                            {t("cancel")}
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn-secondary"
                          style={{ padding: "5px 11px", fontSize: 12 }}
                          onClick={() => {
                            setEditingId(item.id);
                            setEditQty(String(item.quantity));
                          }}
                        >
                          {t("edit")}
                        </button>
                      )}
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

      {editOpen && (
        <EditModal
          clinic={clinic}
          onClose={() => setEditOpen(false)}
          onSaved={(updated) =>
            setData((prev) => ({
              ...prev,
              clinic: { ...prev.clinic, ...updated },
            }))
          }
        />
      )}
      {sendOpen && (
        <SendModal clinic={clinic} onClose={() => setSendOpen(false)} />
      )}
    </div>
  );
}
