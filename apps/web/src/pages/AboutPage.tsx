import { aboutArticle, showIllustrations } from '@humanbase/hb';
import { ArticleFigure, ArticleLayout, ArticleSection, AudioPlayer, DropCapParagraph } from '@humanbase/ui';

export function AboutPage() {
  const { title, lead, source, doi, narration, opening, sections, paragraphs, backMatter } = aboutArticle;
  return (
    <>
      <title>About · Humanbase</title>
      <ArticleLayout
        title={title}
        lead={lead}
        source={source}
        doi={doi}
        band={showIllustrations ? 'capillary' : null}
        player={<AudioPlayer src={narration.src} duration={narration.duration} />}
        backMatter={backMatter.map((section) => (
          <ArticleSection key={section.title} kind="back" title={section.title}>
            {section.body}
          </ArticleSection>
        ))}
      >
        <DropCapParagraph cells={showIllustrations}>{opening}</DropCapParagraph>
        {sections.map((section) => (
          <ArticleSection key={section.title} title={section.title}>
            <p>{section.text}</p>
            <ArticleFigure {...section.figure} />
          </ArticleSection>
        ))}
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </ArticleLayout>
    </>
  );
}
