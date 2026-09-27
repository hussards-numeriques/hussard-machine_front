import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DeleteAccountModal } from './DeleteAccountModal';

const USERNAME = 'Tim';

const renderModal = (overrides: Partial<React.ComponentProps<typeof DeleteAccountModal>> = {}) => {
  const props = {
    username: USERNAME,
    isDeleting: false,
    errorMessage: null,
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
    ...overrides,
  };
  render(<DeleteAccountModal {...props} />);
  return props;
};

const confirmButton = () => screen.getByRole('button', { name: 'Supprimer définitivement' });

describe('DeleteAccountModal', () => {
  it('warns that recovery is impossible', () => {
    renderModal();

    expect(screen.getByText('aucune récupération ne sera possible')).toBeInTheDocument();
  });

  it.each(['', 'tim', 'Ti', 'Tim '])('keeps the delete button disabled for "%s"', (typed) => {
    renderModal();

    fireEvent.change(screen.getByRole('textbox'), { target: { value: typed } });

    expect(confirmButton()).toBeDisabled();
  });

  it('enables the delete button once the exact username is typed', () => {
    const props = renderModal();

    fireEvent.change(screen.getByRole('textbox'), { target: { value: USERNAME } });
    fireEvent.click(confirmButton());

    expect(props.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('locks the modal while the deletion is pending', () => {
    const props = renderModal({ isDeleting: true });

    fireEvent.click(screen.getByRole('dialog').parentElement as HTMLElement);

    expect(screen.getByRole('button', { name: 'Suppression...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Annuler' })).toBeDisabled();
    expect(props.onCancel).not.toHaveBeenCalled();
  });

  it('shows the error message', () => {
    renderModal({ errorMessage: 'La suppression a échoué.' });

    expect(screen.getByText('La suppression a échoué.')).toBeInTheDocument();
  });
});
