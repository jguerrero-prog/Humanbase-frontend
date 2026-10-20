import { expressionEffects } from '@humanbase/ui';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EffectsCard } from './EffectsCard';

const tissue = (feature: string, resource: string, value: number) => ({ feature, cell: resource, context: resource, label: feature, value, group: `${feature}, ${resource}` });
const effects = [tissue('Spleen', 'GTEx', 0.2), tissue('Spleen', 'Roadmap', 0.15), tissue('Liver', 'ENCODE', -0.12)];

const renderCard = (inCellTypes: boolean) =>
  render(
    <EffectsCard
      label="chr5:134,871,851 G>A"
      effects={effects}
      failed={false}
      onRetry={() => undefined}
      scale={expressionEffects}
      threshold={0.1}
      featureNoun="tissue"
      featurePlural="tissues"
      verb="expression"
      inCellTypes={inCellTypes}
      choice={{ label: 'Score', options: [{ value: 'expecto', label: 'Expression effect' }], value: 'expecto', onChange: () => undefined, name: 'Expression effect' }}
    />,
  );

describe('EffectsCard', () => {
  it('narrows ExPecto tissues to one resource', async () => {
    renderCard(false);
    const resource = screen.getByRole('combobox', { name: 'Resource' });
    expect(resource).toHaveTextContent('All resources');
    expect(screen.getByText('Liver')).toBeInTheDocument();
    await userEvent.click(resource);
    await userEvent.click(screen.getByRole('option', { name: 'GTEx' }));
    expect(resource).toHaveTextContent('GTEx');
    expect(screen.queryByText('Liver')).not.toBeInTheDocument();
  });

  it('has no Resource filter where features are measured in cell types', () => {
    renderCard(true);
    expect(screen.queryByRole('combobox', { name: 'Resource' })).not.toBeInTheDocument();
  });
});
