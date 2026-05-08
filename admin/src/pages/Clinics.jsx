import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import { api } from "../lib/api";
import { useLang } from "../lib/i18n";
import {
  Building2,
  ChevronRight,
  Layers,
  Pencil,
  Eye,
  EyeOff,
  TrendingUp,
  Package,
  Trash2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";


// ── Edit Credentials Modal ────────────────────────────────────────────────────
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
    setError("");
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

        <div className="form-group">
          <label className="form-label">{t("clinicName")}</label>
          <input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">{t("username")}</label>
          <input
            value={form.username}
            onChange={(e) => set("username", e.target.value)}
            style={{ fontFamily: "monospace" }}
          />
        </div>

        <div className="form-group">
          <label className="form-label">{t("email")}</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="clinic@example.com"
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            {t("newPassword")}{" "}
            <span style={{ color: "#9CA3AF", fontWeight: 400 }}>
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
              color: "#EF4444",
              fontSize: 13,
              marginBottom: 12,
              padding: "8px 12px",
              background: "#FEE2E2",
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

// ── Delete Clinic Data Modal ──────────────────────────────────────────────────
function DeleteModal({ clinic, onClose, onCleared }) {
  const { t } = useLang();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const name = clinic.name || `${clinic.first_name ?? ""} ${clinic.last_name ?? ""}`.trim();

  async function handleDelete() {
    setDeleting(true);
    setError("");
    try {
      await api.deleteClinicData(clinic.id);
      onCleared(clinic.id);
      onClose();
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  }

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && !deleting && onClose()}
    >
      <div className="modal">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            padding: "8px 0 20px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              background: "var(--red-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AlertTriangle size={26} color="var(--red)" />
          </div>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: "var(--text)",
              margin: 0,
            }}
          >
            {t("deleteClinicConfirm")}
          </h2>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "var(--accent)",
              background: "var(--accent-dim)",
              borderRadius: 8,
              padding: "4px 12px",
            }}
          >
            {name}
          </div>
          <p
            style={{
              fontSize: 13,
              color: "var(--text-secondary)",
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            {t("deleteClinicWarning")}
          </p>
        </div>

        {error && (
          <div
            style={{
              color: "#EF4444",
              fontSize: 13,
              marginBottom: 12,
              padding: "8px 12px",
              background: "#FEE2E2",
              borderRadius: 8,
            }}
          >
            {error}
          </div>
        )}

        <div className="modal-footer">
          <button
            className="btn-secondary"
            onClick={onClose}
            disabled={deleting}
          >
            {t("cancel")}
          </button>
          <button
            className="btn-danger"
            onClick={handleDelete}
            disabled={deleting}
          >
            <Trash2 size={14} />
            {deleting ? t("deleting") : t("deleteClinicBtn")}
          </button>
        </div>
      </div>
    </div>
  );
}

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
  const [editClinic, setEditClinic] = useState(null);
  const [deleteClinic, setDeleteClinic] = useState(null);
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

  function handleSaved(updated) {
    setClinics((prev) =>
      prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)),
    );
  }

  function handleCleared(id) {
    setClinics((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, item_count: 0, total_quantity: 0, total_value: 0 }
          : c,
      ),
    );
  }

  const filtered = clinics.filter((c) => {
    const q = search.toLowerCase();
    const matchesSearch =
      (c.name || "").toLowerCase().includes(q) ||
      (c.username || "").toLowerCase().includes(q) ||
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
                <div
                  style={{ display: "flex", gap: 6 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="btn-ghost"
                    style={{ padding: "6px 10px", fontSize: 12 }}
                    onClick={() => setEditClinic(clinic)}
                    title={t("edit")}
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    className="btn-ghost"
                    style={{
                      padding: "6px 10px",
                      fontSize: 12,
                      color: "var(--red)",
                    }}
                    onClick={() => setDeleteClinic(clinic)}
                    title={t("deleteClinic")}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Credentials */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontFamily: "monospace",
                    color: "var(--accent)",
                    background: "var(--accent-dim)",
                    borderRadius: 8,
                    padding: "4px 10px",
                  }}
                >
                  {clinic.username}
                </div>
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

      {editClinic && (
        <EditModal
          clinic={editClinic}
          onClose={() => setEditClinic(null)}
          onSaved={handleSaved}
        />
      )}
      {deleteClinic && (
        <DeleteModal
          clinic={deleteClinic}
          onClose={() => setDeleteClinic(null)}
          onCleared={handleCleared}
        />
      )}
    </div>
  );
}
