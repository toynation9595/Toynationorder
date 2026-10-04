export const ADDRESS =
  "Rajneel Square, Near Indian Oil Pump, Mumbai-Agra Service Road, Ojhar (MIG), Nashik, Maharashtra 422207";

const PHONE = process.env.NEXT_PUBLIC_CONTACT_PHONE ?? "";
const WHATSAPP = process.env.NEXT_PUBLIC_OWNER_WHATSAPP || PHONE;
export const BUSINESS_HOURS = process.env.NEXT_PUBLIC_BUSINESS_HOURS ?? "";
const DIRECTIONS = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Toy Nation, ${ADDRESS}`)}`;

/** Call / WhatsApp / Get directions. `tone` switches colours for light cards vs the dark footer. */
export default function ContactButtons({ tone = "light", className = "" }: { tone?: "light" | "dark"; className?: string }) {
  const base = "btn px-4 py-2";
  const secondary =
    tone === "light"
      ? "border border-brand/25 bg-white text-brand hover:bg-brand-light"
      : "border border-white/25 bg-white/10 text-white hover:bg-white/20";
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {PHONE && (
        <a href={`tel:+91${PHONE}`} className={`${base} ${tone === "light" ? "bg-brand text-white hover:bg-brand-dark" : "bg-white text-brand hover:bg-brand-light"}`}>
          📞 Call
        </a>
      )}
      {WHATSAPP && (
        <a href={`https://wa.me/91${WHATSAPP}`} target="_blank" rel="noopener noreferrer" className={`${base} bg-[#25D366] text-white hover:bg-[#1ebe5b]`}>
          WhatsApp
        </a>
      )}
      <a href={DIRECTIONS} target="_blank" rel="noopener noreferrer" className={`${base} ${secondary}`}>
        📍 Get directions
      </a>
    </div>
  );
}
