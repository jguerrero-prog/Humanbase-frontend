import { doiLink, humanbaseCitation, humanbaseCitationText, methodCitations } from '@humanbase/hb';
import { ArticleLayout, ArticleSection, Button, useCopy } from '@humanbase/ui';
import './CitePage.css';

function CopyCitation() {
  const { copied, copy, status } = useCopy(humanbaseCitationText, 'Citation copied');
  return (
    <>
      <Button className="cite-copy" variant="secondary" size="small" icon={copied ? 'check' : 'copy'} onClick={() => void copy()}>
        {copied ? 'Copied' : 'Copy citation'}
      </Button>
      {status}
    </>
  );
}

function HumanbaseCitation() {
  const { authors, title, journal, year, doi } = humanbaseCitation;
  return (
    <p>
      {authors} {title} <i>{journal}</i> {year} <a href={doi}>{doi}</a>
    </p>
  );
}

export function CitePage() {
  return (
    <>
      <title>How to cite Humanbase</title>
      <ArticleLayout title="How to cite Humanbase" lead="Your citations help us demonstrate impact and sustain the platform for the research community." band="threads">
        <ArticleSection title="Citing Humanbase">
          <p>If Humanbase has contributed to your research, please cite:</p>
          <HumanbaseCitation />
          <CopyCitation />
        </ArticleSection>
        <hr />
        <ArticleSection title="Additional references">
          <p>If you use specific tools within Humanbase, please also cite the relevant method papers:</p>
          <dl className="cite-methods">
            {methodCitations.map(({ tool, reference, doi }) => (
              <div key={tool}>
                <dt>{tool}</dt>
                <dd>
                  {reference} <a href={doiLink(doi)}>doi:{doi}</a>
                </dd>
              </div>
            ))}
          </dl>
        </ArticleSection>
      </ArticleLayout>
    </>
  );
}
