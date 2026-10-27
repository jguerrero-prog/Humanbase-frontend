import { act, renderHook } from '@testing-library/react';
import { useOverflow } from './useOverflow';

describe('useOverflow', () => {
  const fonts = new EventTarget();
  beforeEach(() => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(private readonly measure: () => void) {}
        observe() {
          this.measure();
        }
        disconnect() {}
      },
    );
    Object.defineProperty(document, 'fonts', { value: fonts, configurable: true });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    Reflect.deleteProperty(document, 'fonts');
  });

  it('measures again when a web font loads and widens the text', () => {
    const element = document.createElement('pre');
    let textWidth = 100;
    Object.defineProperty(element, 'clientWidth', { value: 200 });
    Object.defineProperty(element, 'scrollWidth', { get: () => textWidth });
    const { result } = renderHook(() => useOverflow({ current: element }));
    expect(result.current).toBe(false);
    textWidth = 260;
    act(() => {
      fonts.dispatchEvent(new Event('loadingdone'));
    });
    expect(result.current).toBe(true);
  });
});
