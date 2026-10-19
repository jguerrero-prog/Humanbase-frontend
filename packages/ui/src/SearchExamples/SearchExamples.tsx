import './SearchExamples.css';

export interface SearchExample {
  label: string;
  onSelect: () => void;
}

export interface SearchExamplesProps {
  examples: readonly SearchExample[];
  surface?: 'brand' | 'light';
  lead?: string;
}

// Example searches run straight away instead of filling the field.
export function SearchExamples({ examples, surface = 'light', lead = 'Try' }: SearchExamplesProps) {
  return (
    <p className={`search-examples search-examples-${surface}`}>
      <span>{lead}</span>
      {examples.map((example) => (
        <button key={example.label} type="button" onClick={example.onSelect}>
          {example.label}
        </button>
      ))}
    </p>
  );
}
