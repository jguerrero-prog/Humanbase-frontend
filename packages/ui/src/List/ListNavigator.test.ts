import { ListNavigator } from './ListNavigator';

const tissues = [{ label: 'Adipose tissue' }, { label: 'Blood', disabled: true }, { label: 'Blood vessel' }, { label: 'Bone marrow' }, { label: 'Brain' }];

describe('ListNavigator', () => {
  const nav = new ListNavigator(tissues);

  it('moves in reading order, skips disabled options and stops at the ends', () => {
    expect(nav.first()).toBe(0);
    expect(nav.next(0)).toBe(2);
    expect(nav.previous(2)).toBe(0);
    expect(nav.previous(0)).toBe(0);
    expect(nav.last()).toBe(4);
    expect(nav.next(4)).toBe(4);
  });

  it('jumps to a typed match and keeps building the match while typing quickly', () => {
    const typing = new ListNavigator(tissues);
    expect(typing.typeAhead(0, 'b', 1000)).toBe(2);
    expect(typing.typeAhead(2, 'r', 1100)).toBe(4);
    expect(typing.typeAhead(4, 'a', 3000)).toBe(0);
  });

  it('moves to the nearest option in the neighboring column', () => {
    const analyses = [{ label: 'Networks' }, { label: 'Modules' }, { label: 'Sei' }, { label: 'Beluga' }, { label: 'Seqweaver' }];
    const grid = new ListNavigator(analyses, [[0, 1], [2, 3, 4]]);
    expect(grid.sideways(1, 1)).toBe(3);
    expect(grid.sideways(4, -1)).toBe(1);
    expect(grid.sideways(0, -1)).toBe(0);
  });
});
