import { useId, useRef, useState, type DragEvent } from 'react';
import { Button } from '../Button/Button';
import { Field } from '../Field/Field';
import { Icon } from '../Icon/Icon';
import { RemoveButton } from '../Tag/Tag';
import './FileDrop.css';

export interface FileProblemLine {
  line: number;
  rule: string;
}

export interface ChosenFile {
  name: string;
  size: number;
}

export interface FileDropProps {
  label: string;
  id?: string | undefined;
  error?: string | undefined;
  hideLabel?: boolean;
  accept?: string;
  prompt: string;
  hint?: string;
  file?: ChosenFile | undefined;
  progress?: { text: string; value: number; max: number } | undefined;
  result?: string | undefined;
  problems?: readonly FileProblemLine[] | undefined;
  problemSummary?: string | undefined;
  onFile?: (file: File) => void;
  onRemove?: () => void;
  onDownloadProblems?: () => void;
  'data-state'?: 'drag' | 'focus';
}

const shownProblems = 3;
const sizes = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });

export function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${sizes.format(bytes / 1024)} KB`;
  return `${sizes.format(bytes / 1024 ** 2)} MB`;
}

export function FileDrop({
  label, id: givenId, error, hideLabel = false, accept, prompt, hint, file, progress, result, problems = [], problemSummary, onFile, onRemove, onDownloadProblems, 'data-state': dataState,
}: FileDropProps) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const hasProblems = problems.length > 0;
  const state = !file ? 'empty' : progress ? 'checking' : hasProblems ? 'problems' : 'ready';

  const take = (files: FileList | null) => {
    const chosen = files?.[0];
    if (chosen) onFile?.(chosen);
  };
  const drop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    take(event.dataTransfer.files);
  };

  return (
    <div className={['file-drop-field', hideLabel && 'file-drop-label-hidden'].filter(Boolean).join(' ')}>
      <Field label={label} id={givenId} error={error}>
        {(control) => (
          // Dropping a file is a pointer shortcut; the native file input inside is the keyboard and screen reader path.
          // eslint-disable-next-line jsx-a11y/no-static-element-interactions
          <div
            className="file-drop"
            data-file-state={state}
            data-state={dragging ? 'drag' : dataState}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={drop}
          >
            <input
              {...control}
              ref={input}
              type="file"
              accept={accept}
              className="visually-hidden"
              aria-describedby={[control['aria-describedby'], `${id}-status`].filter(Boolean).join(' ')}
              aria-invalid={control['aria-invalid'] ?? (hasProblems || undefined)}
              onChange={(event) => {
                take(event.target.files);
                event.target.value = '';
              }}
            />
            {state === 'empty' ? (
              <>
                <Icon name="upload" size={24} className="file-drop-icon" />
                {dragging || dataState === 'drag' ? (
                  <p className="file-drop-prompt file-drop-prompt-active">Drop to check the file</p>
                ) : (
                  <p className="file-drop-prompt">
                    {prompt}{' '}
                    <label htmlFor={control.id} className="file-drop-choose">
                      choose a file
                    </label>
                  </p>
                )}
                <p id={`${id}-status`} className="file-drop-hint">
                  {dragging || dataState === 'drag' ? 'Nothing is uploaded until you start the job.' : hint}
                </p>
              </>
            ) : (
              <>
                <div className="file-drop-file">
                  <Icon name="code" size={20} className="file-drop-icon" />
                  <p className="file-drop-name">
                    <strong>{file?.name}</strong>
                    <span>{fileSize(file?.size ?? 0)}</span>
                  </p>
                  <Button variant="ghost" size="small" onClick={() => input.current?.click()}>
                    Replace
                  </Button>
                  <RemoveButton aria-label={`Remove ${file?.name ?? 'file'}`} className="file-drop-remove" onClick={onRemove} />
                </div>
                <div id={`${id}-status`} role="status" className="file-drop-status">
                  {progress ? (
                    <>
                      <p className="file-drop-hint">{progress.text}</p>
                      <progress className="file-drop-progress" value={progress.value} max={progress.max} aria-label={progress.text} />
                    </>
                  ) : (
                    <p className="file-drop-result">
                      <Icon name={hasProblems ? 'alert-circle' : 'check-circle'} size={16} />
                      {hasProblems ? problemSummary : result}
                    </p>
                  )}
                </div>
                {hasProblems && (
                  <>
                    <ul className="file-drop-problems">
                      {problems.slice(0, shownProblems).map(({ line, rule }) => (
                        <li key={line}>
                          <span className="file-drop-line">Line {line.toLocaleString('en-US')}</span>
                          <span>{rule}</span>
                        </li>
                      ))}
                    </ul>
                    {onDownloadProblems && (
                      <Button variant="ghost" size="small" icon="download" onClick={onDownloadProblems}>
                        Download all problems
                      </Button>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        )}
      </Field>
    </div>
  );
}
