interface SectionHeaderProps {
  title: string;
}

export default function SectionHeader({ title }: SectionHeaderProps) {
  return (
    <div className="relative mb-4 mt-10 first:mt-0 flex items-center gap-4">
      <h2 className="shrink-0 text-xs font-semibold tracking-[0.2em] uppercase text-[var(--text-secondary)]">
        {title}
      </h2>
      <div className="h-px flex-1 bg-gradient-to-r from-[var(--text-secondary)]/25 to-transparent" />
    </div>
  );
}
