import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pagination, ShowMore, pageSizeMemory } from './Pagination';

describe('Pagination', () => {
  it('is a labelled landmark that marks the current page', () => {
    render(<Pagination total={7463} noun="datasets" defaultPage={49} />);
    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 49' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('1,201 to 1,225 of 7,463 datasets')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Page 49 of 299, datasets 1,201 to 1,225');
  });

  it('keeps Previous on the first page, disabled', () => {
    render(<Pagination total={7463} noun="datasets" />);
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
  });

  it('moves to the next page', async () => {
    const onPageChange = vi.fn();
    render(<Pagination total={7463} noun="datasets" defaultPage={49} onPageChange={onPageChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(onPageChange).toHaveBeenCalledWith(50);
    expect(screen.getByRole('button', { name: 'Page 50' })).toHaveAttribute('aria-current', 'page');
  });

  it('renders links when given an href builder, so the page lives in the URL', () => {
    render(<Pagination total={7463} noun="datasets" page={49} href={(page) => `?page=${page}`} />);
    expect(screen.getByRole('link', { name: 'Page 50' })).toHaveAttribute('href', '?page=50');
  });

  it('remembers rows per page only when storage works', () => {
    pageSizeMemory.write('rows', 50);
    expect(pageSizeMemory.read('rows', 25)).toBe(50);
    localStorage.setItem('rows', '7');
    expect(pageSizeMemory.read('rows', 25)).toBe(25);
  });
});

describe('ShowMore', () => {
  it('names the step and reports where the new rows start', async () => {
    const onShowMore = vi.fn();
    render(<ShowMore shown={25} total={112} noun="jobs" onShowMore={onShowMore} />);
    expect(screen.getByRole('status')).toHaveTextContent('Showing 25 of 112 jobs');
    await userEvent.click(screen.getByRole('button', { name: 'Show 25 more' }));
    expect(onShowMore).toHaveBeenCalledWith(25);
  });
});
