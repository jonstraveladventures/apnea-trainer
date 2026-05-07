import { useEffect, useRef } from 'react';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

interface UseFocusTrapOptions {
  active: boolean;
  onEscape?: () => void;
}

/**
 * Trap Tab/Shift+Tab focus inside a container while it's mounted.
 * Restores focus to whatever was focused before the trap activated when it deactivates.
 * Optionally invokes `onEscape` when the user presses Escape.
 */
export function useFocusTrap<T extends HTMLElement>({
  active,
  onEscape,
}: UseFocusTrapOptions) {
  const containerRef = useRef<T | null>(null);

  useEffect(() => {
    if (!active) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const node = containerRef.current;
    if (!node) return;

    const focusFirst = () => {
      const focusables = node.querySelectorAll<HTMLElement>(FOCUSABLE);
      const target = focusables[0] ?? node;
      // Allow programmatic focus for the container itself
      if (target === node && !node.hasAttribute('tabindex')) {
        node.setAttribute('tabindex', '-1');
      }
      target.focus();
    };

    // Defer initial focus so any autoFocus inputs get a chance first
    const timer = window.setTimeout(() => {
      if (!node.contains(document.activeElement)) {
        focusFirst();
      }
    }, 0);

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onEscape) {
        e.stopPropagation();
        onEscape();
        return;
      }
      if (e.key !== 'Tab') return;

      const focusables = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const current = document.activeElement as HTMLElement | null;

      if (e.shiftKey && (current === first || !node.contains(current))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && current === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('keydown', handleKeydown);
      // Restore focus to whatever was focused before the modal opened
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus();
      }
    };
  }, [active, onEscape]);

  return containerRef;
}
