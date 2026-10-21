import '@testing-library/jest-dom/vitest';

// jsdom has the dialog element but not its methods; these stand in so tests can open and close one.
Object.assign(HTMLDialogElement.prototype, {
  show(this: HTMLDialogElement) {
    this.setAttribute('open', '');
  },
  showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '');
    this.dataset.modal = '';
  },
  close(this: HTMLDialogElement) {
    this.removeAttribute('open');
    delete this.dataset.modal;
  },
});

// jsdom hides [popover] elements but has no showPopover or hidePopover; these show and hide the element inline.
Object.assign(HTMLElement.prototype, {
  showPopover(this: HTMLElement) {
    this.style.display = 'block';
  },
  hidePopover(this: HTMLElement) {
    this.style.display = 'none';
  },
});

// jsdom has no layout, so nothing ever resizes; this stand-in lets components observe elements.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
