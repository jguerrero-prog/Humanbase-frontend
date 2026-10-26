import { whatsNew } from '@humanbase/hb';
import { ArticleLayout, ArticleSection } from '@humanbase/ui';
import './WhatsNewPage.css';

export function WhatsNewPage() {
  return (
    <>
      <title>What’s new in Humanbase</title>
      <ArticleLayout title="What’s new in Humanbase" lead="Updates to Humanbase’s tools, data and documentation, newest first." band={null}>
        {whatsNew.map(({ month, entries }) => (
          <ArticleSection key={month} title={month}>
            {entries.map(({ title, body }) => (
              <section key={title} className="whats-new-entry">
                <h3>{title}</h3>
                {body}
              </section>
            ))}
          </ArticleSection>
        ))}
      </ArticleLayout>
    </>
  );
}
