/* eslint-disable @next/next/no-img-element */
type Props = { size?: number; className?: string };

/** Signboard photo inside a rounded purple tile (never placed bare on white). */
export default function LogoTile({ size = 44, className = "" }: Props) {
  return (
    <span
      className={`inline-block shrink-0 overflow-hidden rounded-xl bg-brand ring-2 ring-white/20 ${className}`}
      style={{ width: size, height: size }}
    >
      <img src="/logo.png" alt="Toy Nation" width={size} height={size} className="h-full w-full object-cover" />
    </span>
  );
}
