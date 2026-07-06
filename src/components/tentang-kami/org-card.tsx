import type { OrgMember } from "./org-data";

interface OrgCardProps {
  member: OrgMember;
  highlighted?: boolean;
  onActivate?: (id: string) => void;
  onDeactivate?: () => void;
}

const variantClass: Record<OrgMember["variant"], string> = {
  utama: "px-6 py-3 min-w-[200px] max-w-[260px]",
  divisi: "px-5 py-2.5 min-w-[180px] max-w-[220px]",
  staf: "px-5 py-2.5 min-w-[180px] max-w-[220px]",
};

export function OrgCard({ member, highlighted, onActivate, onDeactivate }: OrgCardProps) {
  return (
    <div
      tabIndex={0}
      onMouseEnter={() => onActivate?.(member.id)}
      onMouseLeave={() => onDeactivate?.()}
      onFocus={() => onActivate?.(member.id)}
      onBlur={() => onDeactivate?.()}
      data-highlighted={highlighted ? "" : undefined}
      className={[
        "org-card group relative z-10 rounded-2xl bg-white text-center shadow-sm ring-1 ring-navy-100/70",
        "outline-none transition duration-300 will-change-transform",
        "hover:-translate-y-1 hover:shadow-lg hover:ring-brand-400",
        "focus-visible:-translate-y-1 focus-visible:shadow-lg focus-visible:ring-brand-500",
        "data-[highlighted]:ring-brand-400 data-[highlighted]:shadow-lg",
        variantClass[member.variant],
      ].join(" ")}
    >
      <p className="text-[11px] font-bold uppercase leading-tight tracking-wide text-navy-800">
        {member.role}
      </p>
      <p className="mt-0.5 text-xs leading-tight text-navy-500">{member.nama}</p>
    </div>
  );
}
