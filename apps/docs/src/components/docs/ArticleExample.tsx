import { aboutArticle } from '@humanbase/hb';
import { ArticleFigure, ArticleLayout, ArticleSection, AudioPill, DropCapParagraph, ReferenceList } from '@humanbase/ui';

const references = ['Zhou, J. et al. Nat. Genet. 50, 1171–1179 (2018).', 'Chen, K. M., Wong, A. K., Troyanskaya, O. G. & Zhou, J. Nat. Genet. 54, 940–949 (2022).'];

/** The start of the About page, laid out with the article template. */
export function ArticleExample() {
  const { title, lead, source, doi, narration, opening, sections } = aboutArticle;
  const analysis = sections[1];
  return (
    <ArticleLayout
      title={title}
      titleLevel={2}
      lead={lead}
      source={source}
      doi={doi}
      player={<AudioPill state="idle" duration={narration.duration} />}
      backMatter={
        <ArticleSection kind="back" title="References">
          <ReferenceList references={references} />
        </ArticleSection>
      }
    >
      <DropCapParagraph>{opening}</DropCapParagraph>
      {analysis && (
        <ArticleSection title={analysis.title}>
          <p>{analysis.text}</p>
          <ArticleFigure {...analysis.figure} />
        </ArticleSection>
      )}
    </ArticleLayout>
  );
}
