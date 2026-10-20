import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AboutPanel } from './AboutPanel';

describe('AboutPanel', () => {
  it('names the tool, links its documentation and offers each example', async () => {
    const onUse = vi.fn();
    const onDownload = vi.fn();
    render(
      <AboutPanel tool="NetWAS" docsHref="https://humanbase.readthedocs.io/en/latest/netwas.html" examplesTitle="Example files: the same BMI GWAS" examples={[{ name: 'bmi-vegas.txt', detail: 'VEGAS format', onUse, onDownload }]}>
        NetWAS reprioritizes your GWAS.
      </AboutPanel>,
    );
    expect(screen.getByRole('complementary', { name: 'About NetWAS' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Read the NetWAS documentation/ })).toHaveAttribute('target', '_blank');
    expect(screen.getByRole('heading', { level: 3, name: 'Example files: the same BMI GWAS' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Use the example bmi-vegas.txt' }));
    await userEvent.click(screen.getByRole('button', { name: 'Download bmi-vegas.txt' }));
    expect(onUse).toHaveBeenCalledOnce();
    expect(onDownload).toHaveBeenCalledOnce();
  });

  it('leaves out the documentation link and examples when a tool has none', () => {
    render(<AboutPanel tool="ExPecto SC">Predicts expression effects.</AboutPanel>);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });
});
