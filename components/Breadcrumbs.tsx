import Link from "next/link";

export function Breadcrumbs({
  items
}: {
  items: Array<{ label: string; href?: string }>;
}) {
  return (
    <nav aria-label="Breadcrumb" className="breadcrumbs">
      {items.map((item, index) => (
        <span className="breadcrumbs-item" key={`${item.label}-${index}`}>
          {item.href ? <Link href={item.href}>{item.label}</Link> : <span>{item.label}</span>}
          {index < items.length - 1 ? <span className="breadcrumbs-separator">/</span> : null}
        </span>
      ))}
    </nav>
  );
}
