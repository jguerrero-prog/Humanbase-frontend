import { useSyncExternalStore } from 'react';
import { Tabs } from '../Tabs/Tabs';
import { CodeBlock, type CodeLine } from './CodeBlock';
import { StoredChoice } from './StoredChoice';

export interface CodeExample {
  language: string;
  code: string;
  lines?: readonly CodeLine[];
}

export interface CodeTabsProps {
  label: string;
  examples: readonly CodeExample[];
  defaultLanguage?: string;
}

const languageChoice = new StoredChoice('humanbase:code-language');
const subscribe = (listener: () => void) => languageChoice.subscribe(listener);
const readChoice = () => languageChoice.read();
const noChoiceOnServer = () => undefined;

export function CodeTabs({ label, examples, defaultLanguage }: CodeTabsProps) {
  const stored = useSyncExternalStore(subscribe, readChoice, noChoiceOnServer);
  const shown =
    examples.find((example) => example.language === stored) ??
    examples.find((example) => example.language === defaultLanguage) ??
    examples[0];

  return (
    <Tabs
      label={label}
      tabs={examples.map((example) => ({ value: example.language, label: example.language }))}
      value={shown?.language ?? ''}
      onChange={(language) => languageChoice.write(language)}
    >
      {shown && <CodeBlock label={shown.language} code={shown.code} {...(shown.lines ? { lines: shown.lines } : {})} />}
    </Tabs>
  );
}
