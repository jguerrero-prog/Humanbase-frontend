import { Fragment } from 'react';

/** Lets long identifiers such as H1_Derived_Neuronal_Progenitor_Cultured_Cells wrap after _, / and , instead of mid-word. */
export function BreakableText({ children }: { children: string }) {
  const parts = children.split(/(?<=[_/,])/);
  return (
    <>
      {parts.map((part, index) => (
        <Fragment key={index}>
          {part}
          {index < parts.length - 1 && <wbr />}
        </Fragment>
      ))}
    </>
  );
}
