import React, { useState } from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ModalShell from '../ModalShell';

const Harness: React.FC<{
  startOpen?: boolean;
  closeOnBackdrop?: boolean;
}> = ({ startOpen = true, closeOnBackdrop = true }) => {
  const [open, setOpen] = useState(startOpen);
  return (
    <>
      <button data-testid="opener" onClick={() => setOpen(true)}>Open</button>
      <ModalShell
        isOpen={open}
        onClose={() => setOpen(false)}
        labelledBy="t"
        closeOnBackdrop={closeOnBackdrop}
      >
        <h1 id="t">Dialog</h1>
        <button data-testid="first">First</button>
        <button data-testid="second">Second</button>
        <button data-testid="last" onClick={() => setOpen(false)}>Close</button>
      </ModalShell>
    </>
  );
};

describe('ModalShell', () => {
  it('renders nothing when closed', () => {
    render(<Harness startOpen={false} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders with the correct ARIA attributes when open', () => {
    render(<Harness />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 't');
  });

  it('closes when Escape is pressed', () => {
    render(<Harness />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('closes on backdrop click when allowed', () => {
    render(<Harness closeOnBackdrop />);
    const dialog = screen.getByRole('dialog');
    fireEvent.mouseDown(dialog, { target: dialog, currentTarget: dialog });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('does not close on backdrop click when closeOnBackdrop is false', () => {
    render(<Harness closeOnBackdrop={false} />);
    const dialog = screen.getByRole('dialog');
    fireEvent.mouseDown(dialog, { target: dialog, currentTarget: dialog });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('wraps focus from last back to first when Tab is pressed at the end', async () => {
    render(<Harness />);
    // Wait for the deferred initial focus.
    await act(() => Promise.resolve());

    screen.getByTestId('last').focus();
    act(() => {
      fireEvent.keyDown(document, { key: 'Tab' });
    });
    expect(document.activeElement).toBe(screen.getByTestId('first'));
  });

  it('wraps focus from first to last on Shift+Tab', async () => {
    render(<Harness />);
    await act(() => Promise.resolve());

    screen.getByTestId('first').focus();
    act(() => {
      fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    });
    expect(document.activeElement).toBe(screen.getByTestId('last'));
  });
});
