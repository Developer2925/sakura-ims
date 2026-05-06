const LABELS = {
  pending:   '保留中',
  approved:  '承認済み',
  rejected:  '却下',
  delivered: '納品済み',
};

export default function StatusBadge({ status }) {
  return (
    <span className={`badge badge-${status}`}>
      {LABELS[status] ?? status}
    </span>
  );
}
