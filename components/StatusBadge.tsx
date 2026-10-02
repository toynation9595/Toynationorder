const STYLES: Record<string, string> = {
  new: "bg-tn-orange/15 text-tn-orange",
  confirmed: "bg-brand-light text-brand",
  packed: "bg-tn-yellow/20 text-[#8a6d00]",
  dispatched: "bg-tn-teal/15 text-tn-teal",
  cancelled: "bg-gray-100 text-gray-500",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STYLES[status] ?? STYLES.new}`}>
      {status}
    </span>
  );
}
