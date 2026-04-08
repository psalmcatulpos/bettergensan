import { cn } from '../../lib/utils';

// Section — full-width band with a centered narrow inner container.
// Standardized at the global 1100px max-width so every page that uses
// <Section> automatically aligns with the rest of the site.
export default function Section({
  children,
  className,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section className={cn('bg-white py-12', className)} id={id}>
      <div className={cn('mx-auto max-w-[1100px] px-4', className)}>
        {children}
      </div>
    </section>
  );
}
