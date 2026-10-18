import { fireEvent, render, screen } from '@testing-library/react';
import { genomeCommand } from './genomeBrowserKeys';
import { TracksDrawer } from './GenomeBrowserPanels';
import { GenomeBrowserToolbar, TrackHeader } from './GenomeBrowserToolbar';

const press = (key: string, ctrlKey = false) => genomeCommand({ key, ctrlKey, metaKey: false, altKey: false });

describe('genomeCommand', () => {
  it('keeps today’s shortcuts', () => {
    expect(press('ArrowLeft')).toBe('moveLeft');
    expect(press('ArrowRight', true)).toBe('nextVariant');
    expect(press('+')).toBe('zoomIn');
    expect(press('-')).toBe('zoomOut');
    expect(press(' ')).toBe('toggleZoom');
    expect(press('A')).toBe('openTracks');
    expect(press('x')).toBe('openExport');
    expect(press('c')).toBe('clearHighlights');
    expect(press('q')).toBeUndefined();
  });
});

describe('GenomeBrowserToolbar', () => {
  it('names every control and sends the typed location', () => {
    const onLocation = vi.fn();
    const onZoomStop = vi.fn();
    render(<GenomeBrowserToolbar location="chr1:109,792,590-109,842,590" assembly="GRCh37/hg19" widthHelp="50 kb shown. A gene name works too." zoomStop={50000} onLocation={onLocation} onZoomStop={onZoomStop} />);
    expect(screen.getByRole('button', { name: 'Zoom in' })).toHaveAttribute('aria-keyshortcuts', '+');
    expect(screen.getByRole('radio', { name: '50 kb' })).toBeChecked();
    fireEvent.click(screen.getByRole('radio', { name: '2 kb' }));
    expect(onZoomStop).toHaveBeenCalledWith(2000);
    const field = screen.getByRole('searchbox', { name: 'Location or gene' });
    fireEvent.change(field, { target: { value: 'SORT1' } });
    fireEvent.submit(screen.getByRole('search'));
    expect(onLocation).toHaveBeenCalledWith('SORT1');
  });

  it('labels the track menu with the track name', () => {
    render(<TrackHeader name="Genes" source="GENCODE 19" menuItems={[{ label: 'Remove track' }]} />);
    expect(screen.getByRole('button', { name: 'Genes track options' })).toBeInTheDocument();
    expect(screen.getByText('GENCODE 19')).toBeInTheDocument();
  });
});

describe('TracksDrawer', () => {
  it('turns suggested tracks on and off', () => {
    const onToggle = vi.fn();
    render(<TracksDrawer inline open tracks={[{ id: 'cons', label: 'Conservation', source: 'Suggested track, as today', shown: false }]} onToggle={onToggle} />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Conservation' }));
    expect(onToggle).toHaveBeenCalledWith('cons', true);
  });
});
