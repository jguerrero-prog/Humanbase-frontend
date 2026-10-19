import { CopyButton } from '../CodeBlock/CodeBlock';
import { ScaleLegend } from '../Legend/Legend';
import './Results.css';

export interface NetwasGuideProps {
  tissue: string;
  threshold: string;
  citation: string;
  headingLevel?: 2 | 3 | 4;
}

export function NetwasGuide({ tissue, threshold, citation, headingLevel = 2 }: NetwasGuideProps) {
  const Heading = `h${headingLevel}` as const;
  const Subheading = `h${headingLevel + 1}` as 'h3' | 'h4' | 'h5';
  return (
    <div className="netwas-guide">
      <Heading className="netwas-guide-heading">How to read this</Heading>
      <p>
        NetWAS created a classifier based on your GWAS results. It considered genes with a p-value below {threshold} as positive examples and randomly selected 10,000 other genes as negative examples. The classifier used the connections of each gene within the {tissue} network to calculate a score for every gene.
      </p>
      <ScaleLegend title="NetWAS score" scale="diverging" ticks={['More like non-significant genes', '0', 'More like the hits']} />
      <p>
        The score indicates how far a data point is from the classifier’s boundary, with 0 being the boundary itself. The training labels indicate the significance of each gene: 1 means significant, −1 means not significant, and 0 means not used.
      </p>
      <div className="netwas-guide-cite">
        <Subheading className="netwas-guide-subheading">Cite NetWAS</Subheading>
        <p>{citation}</p>
        <CopyButton text={citation} label="citation" />
      </div>
    </div>
  );
}
