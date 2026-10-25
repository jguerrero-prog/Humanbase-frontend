import { Icon } from '../Icon/Icon';
import { Cell, HeaderCell, Table } from '../Table/Table';
import './Results.css';

export interface ResultFile {
  name: string;
  /** What the file holds, such as One score per variant, as a genome track. */
  holds: string;
  format: string;
  /** Missing while the job still runs. */
  href?: string | undefined;
}

export interface ResultFilesProps {
  files: readonly ResultFile[];
  caption?: string;
}

/** Every file a job writes, named in plain words, each with its own download. */
export function ResultFiles({ files, caption = 'Result files' }: ResultFilesProps) {
  // The file column keeps room for its name and description; on a phone the table scrolls instead.
  return (
    <Table caption={caption} columnWidths={['auto', '220px', '160px']} minWidth="38rem">
      <thead>
        <tr>
          <HeaderCell>File</HeaderCell>
          <HeaderCell>Format</HeaderCell>
          <HeaderCell>
            <span className="visually-hidden">Download</span>
          </HeaderCell>
        </tr>
      </thead>
      <tbody>
        {files.map((file) => (
          <tr key={file.name}>
            <Cell rowHeader>
              <span className="result-file-name">{file.name}</span>
              <span className="result-file-about">{file.holds}</span>
            </Cell>
            <Cell wrap>{file.format}</Cell>
            <Cell>
              {file.href ? (
                <a className="button button-ghost button-small" href={file.href}>
                  <Icon name="download" size={16} />
                  Download <span className="visually-hidden">{file.name}</span>
                </a>
              ) : (
                <span className="result-file-about">When it finishes</span>
              )}
            </Cell>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
