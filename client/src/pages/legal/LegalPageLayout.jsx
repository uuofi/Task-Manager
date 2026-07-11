import { SiteFooter } from '@/components/marketing/SiteFooter';
import { SiteHeader } from '@/components/marketing/SiteHeader';

/**
 * Splits a section body into paragraph/list blocks using a tiny markdown-lite
 * convention: blank lines separate paragraphs, and a block whose lines all
 * start with "- " renders as a bullet list. Keeps the i18n resource file to
 * plain strings instead of nested arrays of objects.
 */
function renderBody(body) {
  const blocks = body.trim().split(/\n\s*\n/);
  return blocks.map((block, i) => {
    const lines = block
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const isList = lines.length > 0 && lines.every((l) => l.startsWith('- '));

    if (isList) {
      return (
        <ul key={i} className="list-disc space-y-1.5 ps-5 marker:text-muted-foreground/60">
          {lines.map((line, j) => (
            <li key={j}>{line.slice(2)}</li>
          ))}
        </ul>
      );
    }
    return <p key={i}>{lines.join(' ')}</p>;
  });
}

/**
 * Shared chrome for standalone legal/informational pages (privacy, terms,
 * intellectual property): header, title block, and prose sections.
 */
export function LegalPageLayout({ title, lastUpdated, intro, sections }) {
  return (
    <div className="bg-background text-foreground relative min-h-screen">
      <SiteHeader />

      <main className="relative z-10 mx-auto max-w-3xl px-6 py-16 sm:py-20">
        <header className="mb-12">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
          {lastUpdated && <p className="text-muted-foreground mt-3 text-sm">{lastUpdated}</p>}
          {intro && <p className="text-muted-foreground mt-6 text-base leading-relaxed">{intro}</p>}
        </header>

        <div className="space-y-10">
          {sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-xl font-semibold tracking-tight">{section.heading}</h2>
              <div className="text-muted-foreground mt-3 space-y-3 text-[15px] leading-relaxed">
                {renderBody(section.body)}
              </div>
            </section>
          ))}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

export default LegalPageLayout;
