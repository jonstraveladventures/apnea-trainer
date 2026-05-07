import React from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface ModalShellProps {
  isOpen: boolean;
  onClose?: () => void;
  /** ID of the element that titles the dialog — wired to aria-labelledby. */
  labelledBy?: string;
  /** Tailwind classes for the inner panel. Defaults to a centered card. */
  panelClassName?: string;
  /** When true, clicking the overlay backdrop calls onClose. */
  closeOnBackdrop?: boolean;
  children: React.ReactNode;
}

/**
 * Standard modal scaffold: full-screen overlay + centered panel + focus trap +
 * Escape-to-close + focus restore on unmount. Use this for every dialog so the
 * a11y wiring stays consistent.
 */
const ModalShell: React.FC<ModalShellProps> = ({
  isOpen,
  onClose,
  labelledBy,
  panelClassName = 'bg-white dark:bg-deep-800 rounded-lg p-6 max-w-md w-full mx-4',
  closeOnBackdrop = true,
  children,
}) => {
  const containerRef = useFocusTrap<HTMLDivElement>({
    active: isOpen,
    onEscape: onClose,
  });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      onMouseDown={(e) => {
        if (closeOnBackdrop && onClose && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={containerRef}
        className={panelClassName}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

export default ModalShell;
