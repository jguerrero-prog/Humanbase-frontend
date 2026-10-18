import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Accordion, AccordionItem } from './Accordion';

describe('Accordion', () => {
  const filters = (
    <Accordion size="compact">
      <AccordionItem title="Evidence" summary="2 selected">
        Co-expression and protein interaction are on.
      </AccordionItem>
      <AccordionItem title="Score" summary="0.5 or more">
        Scores from 0.5.
      </AccordionItem>
    </Accordion>
  );

  it('is a heading that holds a button named with its summary', () => {
    render(filters);
    const button = screen.getByRole('button', { name: 'Evidence, 2 selected' });
    expect(button.closest('h3')).not.toBeNull();
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(document.getElementById(button.getAttribute('aria-controls') ?? '')).toHaveAttribute('hidden', 'until-found');
  });

  it('opens several items at once', async () => {
    render(filters);
    await userEvent.click(screen.getByRole('button', { name: /Evidence/ }));
    await userEvent.click(screen.getByRole('button', { name: /Score/ }));
    expect(screen.getByRole('button', { name: /Evidence/ })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: /Score/ })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Scores from 0.5.')).toBeVisible();
  });

  it('opens when the browser finds text inside it', () => {
    render(filters);
    const region = screen.getByText('Scores from 0.5.').parentElement as HTMLElement;
    fireEvent(region, new Event('beforematch'));
    expect(screen.getByRole('button', { name: /Score/ })).toHaveAttribute('aria-expanded', 'true');
  });

  it('stays focusable but closed when disabled', async () => {
    render(
      <Accordion>
        <AccordionItem title="Advanced options" disabled>
          Options
        </AccordionItem>
      </Accordion>,
    );
    const button = screen.getByRole('button', { name: 'Advanced options' });
    await userEvent.tab();
    expect(button).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });
});
