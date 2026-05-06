import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { api } from "../lib/api";
import { useLang } from "../lib/i18n";
import {
  CheckCircle,
  XCircle,
  Truck,
  MessageSquare,
  Package,
  RefreshCw,
} from "lucide-react";

const STATUS_KEYS = [
  "",
  "pending",
  "approved",
  "out_for_delivery",
  "rejected",
  "delivered",
];

const STATUS_COLORS = {
  pending: { bg: "var(--amber-light)", text: "#92400E" },
  approved: { bg: "var(--green-light)", text: "#065F46" },
  rejected: { bg: "var(--red-light)", text: "#991B1B" },
  out_for_delivery: { bg: "rgba(142,200,255,0.15)", text: "#1D6FA4" },
  delivered: { bg: "var(--primary-light)", text: "var(--primary-dark)" },
};

function fmt(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function RestockRequests() {
  const { t } = useLang();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [noteModal, setNoteModal] = useState(null);
  const [noteText, setNoteText] = useState("");
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from(".restock-filters", {
        y: -16,
        opacity: 0,
        duration: 0.35,
        ease: "power2.out",
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!containerRef.current || !requests.length) return;
    const ctx = gsap.context(() => {
      gsap.from(".restock-table-wrap", {
        y: 24,
        opacity: 0,
        duration: 0.4,
        ease: "power2.out",
      });
      gsap.from(".restock-row", {
        x: -16,
        opacity: 0,
        stagger: 0.04,
        duration: 0.35,
        ease: "power2.out",
        delay: 0.15,
      });
    }, containerRef);
    return () => ctx.revert();
  }, [requests]);

  function load() {
    setLoading(true);
    const params = statusFilter ? { status: statusFilter } : {};
    api
      .getRestockRequests(params)
      .then((d) => setRequests(d.requests))
      .finally(() => setLoading(false));
  }
  useEffect(() => {
    load();
  }, [statusFilter]);

  function openModal(requestId, action) {
    setNoteModal({ requestId, action });
    setNoteText("");
  }

  async function handleAction() {
    if (!noteModal) return;
    const { requestId, action } = noteModal;
    setActionLoading(requestId);
    try {
      if (action === "approve") await api.approveRequest(requestId, noteText);
      else if (action === "reject")
        await api.rejectRequest(requestId, noteText);
      else if (action === "deliver") await api.deliverRequest(requestId);
      setNoteModal(null);
      load();
    } catch (err) {
      alert(t("actionFailed") + ": " + err.message);
    } finally {
      setActionLoading(null);
    }
  }

  async function quickDeliver(requestId) {
    setActionLoading(requestId);
    try {
      await api.deliverRequest(requestId);
      load();
    } catch (err) {
      alert(t("actionFailed") + ": " + err.message);
    } finally {
      setActionLoading(null);
    }
  }

  const FILTER_LABELS = {
    "": t("all"),
    pending: t("pending"),
    approved: t("approved"),
    out_for_delivery: t("outForDelivery"),
    rejected: t("rejected"),
    delivered: t("delivered"),
  };

  return (
    <div ref={containerRef}>
      <div
        className="restock-filters"
        style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}
      >
        {STATUS_KEYS.map((key) => (
          <button
            key={key}
            className={`filter-pill${statusFilter === key ? " active" : ""}`}
            onClick={() => setStatusFilter(key)}
          >
            {FILTER_LABELS[key]}
          </button>
        ))}
        <button
          className="btn-secondary"
          style={{ marginLeft: "auto", padding: "6px 12px", display: "flex", alignItems: "center", gap: 6 }}
          onClick={load}
          disabled={loading}
        >
          <RefreshCw size={13} style={loading ? { animation: "spin 0.7s linear infinite" } : {}} />
          {t("refresh")}
        </button>
      </div>

      {loading ? (
        <div className="loading">{t("loading")}</div>
      ) : (
        <div className="table-wrap restock-table-wrap">
          {requests.length === 0 ? (
            <div className="empty-state">
              <Package size={40} color="var(--border)" />
              <span>{t("noRequestsFound")}</span>
            </div>
          ) : (
            <table style={{ tableLayout: "fixed", width: "100%" }}>
              <thead>
                <tr>
                  <th style={{ width: "18%" }}>{t("item")}</th>
                  <th style={{ width: "14%" }}>{t("clinic")}</th>
                  <th style={{ width: "6%", textAlign: "center" }}>
                    {t("qty")}
                  </th>
                  <th style={{ width: "10%" }}>{t("status")}</th>
                  <th style={{ width: "10%" }}>{t("requested")}</th>
                  <th style={{ width: "9%" }}>{t("approvedDate")}</th>
                  <th style={{ width: "9%" }}>{t("shippedDate")}</th>
                  <th style={{ width: "9%" }}>{t("deliveredDate")}</th>
                  <th style={{ width: "22%", whiteSpace: "nowrap" }}>
                    {t("actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => {
                  const sc = STATUS_COLORS[r.status] ?? {};
                  return (
                    <tr key={r.id} className="restock-row">
                      <td>
                        <div style={{ fontWeight: 700 }}>{r.item_name}</div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "var(--text-secondary)",
                            marginTop: 2,
                          }}
                        >
                          {r.category}
                        </div>
                        {r.notes && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              fontSize: 12,
                              color: "var(--text-secondary)",
                              marginTop: 4,
                            }}
                          >
                            <MessageSquare size={11} /> {r.notes}
                          </div>
                        )}
                      </td>
                      <td style={{ fontWeight: 600, color: "var(--primary)" }}>
                        {r.clinic_name?.split("|")[0]?.trim()}
                      </td>
                      <td style={{ textAlign: "center", fontWeight: 700 }}>
                        {r.requested_quantity}
                      </td>
                      <td>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "4px 12px",
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 700,
                            background: sc.bg,
                            color: sc.text,
                          }}
                        >
                          {t(r.status)}
                        </span>
                      </td>
                      <td
                        style={{ color: "var(--text-secondary)", fontSize: 13 }}
                      >
                        {fmt(r.requested_at)}
                      </td>
                      <td
                        style={{ color: "var(--text-secondary)", fontSize: 13 }}
                      >
                        {fmt(r.approved_at)}
                      </td>
                      <td
                        style={{ color: "var(--text-secondary)", fontSize: 13 }}
                      >
                        {fmt(r.shipped_at)}
                      </td>
                      <td
                        style={{ color: "var(--text-secondary)", fontSize: 13 }}
                      >
                        {fmt(r.delivered_at)}
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            gap: 6,
                            flexWrap: "nowrap",
                            alignItems: "center",
                          }}
                        >
                          {r.status === "pending" && (
                            <>
                              <button
                                className="btn-success"
                                style={{
                                  padding: "5px 12px",
                                  fontSize: 12,
                                  whiteSpace: "nowrap",
                                }}
                                onClick={() => openModal(r.id, "approve")}
                                disabled={actionLoading === r.id}
                              >
                                <CheckCircle size={13} /> {t("approve")}
                              </button>
                              <button
                                className="btn-danger"
                                style={{
                                  padding: "5px 12px",
                                  fontSize: 12,
                                  whiteSpace: "nowrap",
                                }}
                                onClick={() => openModal(r.id, "reject")}
                                disabled={actionLoading === r.id}
                              >
                                <XCircle size={13} /> {t("reject")}
                              </button>
                            </>
                          )}
                          {r.status === "approved" && (
                            <button
                              className="btn-teal"
                              style={{
                                padding: "5px 12px",
                                fontSize: 12,
                                whiteSpace: "nowrap",
                              }}
                              onClick={() => quickDeliver(r.id)}
                              disabled={actionLoading === r.id}
                            >
                              <Truck size={13} />{" "}
                              {actionLoading === r.id ? "..." : t("ship")}
                            </button>
                          )}
                          {r.status === "out_for_delivery" && (
                            <span
                              style={{
                                fontSize: 12,
                                color: "#1D6FA4",
                                display: "flex",
                                alignItems: "center",
                                gap: 5,
                              }}
                            >
                              <Truck size={13} /> {t("awaitingClinicConfirm")}
                            </span>
                          )}
                        </div>
                        {r.admin_note && (
                          <div
                            style={{
                              fontSize: 11,
                              color: "var(--text-secondary)",
                              marginTop: 6,
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <MessageSquare size={10} /> {r.admin_note}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {noteModal && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setNoteModal(null)}
        >
          <div className="modal">
            <h2
              className="modal-title"
              style={{ display: "flex", alignItems: "center", gap: 10 }}
            >
              {noteModal.action === "approve" ? (
                <>
                  <CheckCircle size={20} color="var(--green)" />{" "}
                  {t("approveRequest")}
                </>
              ) : (
                <>
                  <XCircle size={20} color="var(--red)" /> {t("rejectRequest")}
                </>
              )}
            </h2>
            <div className="form-group">
              <label className="form-label">
                {t("adminNote")}{" "}
                <span
                  style={{ color: "var(--text-secondary)", fontWeight: 400 }}
                >
                  {t("optional")}
                </span>
              </label>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={3}
                placeholder={t("addNoteForClinic")}
              />
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setNoteModal(null)}
              >
                {t("cancel")}
              </button>
              <button
                className={
                  noteModal.action === "approve" ? "btn-success" : "btn-danger"
                }
                onClick={handleAction}
                disabled={!!actionLoading}
              >
                {noteModal.action === "approve"
                  ? t("confirmApprove")
                  : t("confirmReject")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
