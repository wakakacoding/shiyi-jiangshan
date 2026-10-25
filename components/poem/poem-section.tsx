export function PoemSection({ id, number, title, paragraphs, className = "" }: {
  id: string;
  number: string;
  title: string;
  paragraphs: string[];
  className?: string;
}) {
  return (
    <section id={id} className={`poem-section ${className}`} aria-labelledby={`${id}-title`}>
      <div className="section-label">
        <span>{number}</span>
        <h2 id={`${id}-title`}>{title}</h2>
      </div>
      <div className="prose">
        {paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
      </div>
    </section>
  );
}
