import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { api } from "../lib/api";
import { useLang } from "../lib/i18n";

export default function ClinicInventory() {
  const { id } = useParams();
  const { t } = useLang();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editQty, setEditQty] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  function load() {
    setLoading(true);
    api
      .getClinicInventory(id)
      .then(setData)
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [id]);

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
            ? { ...i, quantity: qty, total_price: (i.price * qty).toFixed(2) }
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

  if (loading) return <div className="loading">{t("loading")}</div>;
  if (!data) return <div className="loading">{t("noData")}</div>;

  const { clinic, items } = data;
  const filtered = items.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.category.toLowerCase().includes(search.toLowerCase()),
  );
  const totalValue = items.reduce((s, i) => s + Number(i.total_price), 0);

  return (
    <div>
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => navigate("/clinics")}
            className="btn-secondary"
            style={{ padding: "8px 14px" }}
          >
            ← {t("back")}
          </button>
          <div>
            <h1 className="page-title">{clinic.name.split("|")[0]?.trim()}</h1>
            <div
              style={{
                fontSize: 13,
                color: "#9CA3AF",
                fontFamily: "monospace",
              }}
            >
              {clinic.username}
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
          <button
            className="btn-secondary"
            style={{ padding: "6px 12px", display: "flex", alignItems: "center", gap: 6 }}
            onClick={load}
            disabled={loading}
          >
            <RefreshCw size={13} style={loading ? { animation: "spin 0.7s linear infinite" } : {}} />
            {t("refresh")}
          </button>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#E8909D" }}>
            ¥{totalValue.toLocaleString()}
          </div>
          <div style={{ fontSize: 13, color: "#9CA3AF" }}>
            {t("totalStockValueLabel")}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <input
          placeholder={t("searchItems")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 360 }}
        />
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>{t("itemName")}</th>
              <th>{t("category")}</th>
              <th>{t("price")}</th>
              <th>{t("qty")}</th>
              <th>{t("totalValue")}</th>
              <th>{t("expiry")}</th>
              <th>{t("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id}>
                <td>
                  <div style={{ fontWeight: 700 }}>{item.name}</div>
                  {item.manufacturer && (
                    <div style={{ fontSize: 12, color: "#9CA3AF" }}>
                      {item.manufacturer}
                    </div>
                  )}
                  {item.internal_id && (
                    <div
                      style={{
                        fontSize: 11,
                        fontFamily: "monospace",
                        color: "#9CA3AF",
                      }}
                    >
                      {item.internal_id}
                    </div>
                  )}
                </td>
                <td>{item.category}</td>
                <td>¥{Number(item.price).toFixed(2)}</td>
                <td>
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
                        color: item.quantity <= 10 ? "#E8909D" : "#1A1A1A",
                      }}
                    >
                      {item.quantity}
                    </span>
                  )}
                </td>
                <td style={{ fontWeight: 700, color: "#E8909D" }}>
                  ¥{Number(item.total_price).toFixed(2)}
                </td>
                <td style={{ color: "#9CA3AF" }}>{item.expiry_date || "—"}</td>
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
                      style={{ padding: "5px 12px", fontSize: 12 }}
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
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="empty-state">{t("noItemsFound")}</div>
        )}
      </div>
    </div>
  );
}
