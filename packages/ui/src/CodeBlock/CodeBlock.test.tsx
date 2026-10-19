import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CodeBlock, InlineCode } from './CodeBlock';
import { CodeTabs } from './CodeTabs';

const request = 'curl -X GET "https://humanbase.io/api/"';

describe('CodeBlock', () => {
  it('is a figure named by its label, with the code in a pre', () => {
    render(<CodeBlock label="Request" code={request} />);
    expect(screen.getByRole('figure', { name: 'Request' })).toBeInTheDocument();
    expect(screen.getByText(request).closest('pre')).not.toBeNull();
  });

  it('starts a response over 40 lines collapsed to 12, and copy still copies all of it', async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    const response = Array.from({ length: 50 }, (_, line) => `"field${line}": string`).join('\n');
    render(<CodeBlock label="Response shape" code={response} />);

    const code = screen.getByRole('figure', { name: 'Response shape' }).querySelector('pre');
    expect(code?.textContent?.split('\n')).toHaveLength(12);
    await user.click(screen.getByRole('button', { name: 'Show full response' }));
    expect(code?.textContent?.split('\n')).toHaveLength(50);
    expect(screen.getByRole('button', { name: 'Show less' })).toHaveAttribute('aria-expanded', 'true');

    await user.click(screen.getByRole('button', { name: 'Copy Response shape' }));
    expect(writeText).toHaveBeenCalledWith(response);
  });

  it('leaves short blocks open, with no disclosure', () => {
    render(<CodeBlock label="Request" code={request} />);
    expect(screen.queryByRole('button', { name: 'Show full response' })).toBeNull();
  });

  it('renders highlighted lines with a class per syntax role', () => {
    render(
      <CodeBlock
        label="Request"
        code={request}
        lines={[[{ text: 'curl', role: 'command' }, { text: ' ', role: 'text' }, { text: '-X', role: 'flag' }]]}
      />,
    );
    expect(screen.getByText('curl')).toHaveClass('syntax-command');
    expect(screen.getByText('-X')).toHaveClass('syntax-flag');
  });

  it('copies the code only, says Copied for 2 seconds and announces it', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    onTestFinished(() => {
      vi.useRealTimers();
    });
    const user = userEvent.setup({ advanceTimers: (ms) => vi.advanceTimersByTime(ms) });
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    render(<CodeBlock label="Request" code={request} />);

    await user.click(screen.getByRole('button', { name: 'Copy Request' }));
    expect(writeText).toHaveBeenCalledWith(request);
    expect(screen.getByRole('button', { name: 'Copied Request' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Request copied');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(screen.getByRole('button', { name: 'Copy Request' })).toBeInTheDocument();
  });

  it('leaves the copy button out when asked', () => {
    render(<CodeBlock label="Markup" code="<h3></h3>" copy={false} />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('marks inline code', () => {
    render(<p>Send the genes to <InlineCode>/api/modules/</InlineCode></p>);
    expect(screen.getByText('/api/modules/')).toHaveClass('inline-code');
  });
});

describe('CodeTabs', () => {
  const examples = [
    { language: 'curl', code: request },
    { language: 'Python', code: 'import requests' },
  ];

  it('switches language and keeps the choice for every block on the page', async () => {
    render(
      <>
        <CodeTabs label="Request language" examples={examples} />
        <CodeTabs label="Response language" examples={examples} />
      </>,
    );
    await userEvent.click(within(screen.getByRole('tablist', { name: 'Request language' })).getByRole('tab', { name: 'Python' }));
    expect(screen.getAllByRole('figure', { name: 'Python' })).toHaveLength(2);
    expect(localStorage.getItem('humanbase:code-language')).toBe('Python');
  });
});
