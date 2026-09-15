import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type ToastType = 'error' | 'success' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
}

interface ModalState {
  open: boolean;
  title: string;
  message: string;
  onConfirm?: () => void;
  confirmLabel?: string;
  danger?: boolean;
}

interface UIContextValue {
  toast: (type: ToastType, title: string, message: string) => void;
  confirm: (title: string, message: string, onConfirm: () => void, opts?: { confirmLabel?: string; danger?: boolean }) => void;
}

const UIContext = createContext<UIContextValue | null>(null);

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used inside UIProvider');
  return ctx;
}

/* ─── Toast Notification ──────────────────────────────────────────────────── */
function ToastNotification({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const colors: Record<ToastType, { bg: string; border: string; icon: string; text: string }> = {
    error:   { bg: 'var(--color-status-danger-bg)',  border: 'var(--color-status-danger-border)',  icon: '✕', text: 'var(--color-status-danger)' },
    success: { bg: 'var(--color-status-success-bg)', border: 'var(--color-status-success-border)', icon: '✓', text: 'var(--color-status-success)' },
    warning: { bg: 'var(--color-status-warning-bg)', border: 'var(--color-status-warning-border)', icon: '⚠', text: 'var(--color-status-warning)' },
    info:    { bg: 'var(--color-status-info-bg)',    border: 'var(--color-status-info-border)',    icon: 'ℹ', text: 'var(--color-status-info)' },
  };
  const c = colors[toast.type];

  return (
    <div
      style={{
        backgroundColor: c.bg,
        border: `1px solid ${c.border}`,
        borderLeft: `4px solid ${c.text}`,
        borderRadius: 'var(--border-radius-md)',
        padding: '0.875rem 1rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        minWidth: '320px',
        maxWidth: '480px',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <span style={{ fontWeight: 700, color: c.text, fontSize: '1.1rem', lineHeight: 1 }}>{c.icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-shark)', marginBottom: '0.15rem' }}>
          {toast.title}
        </div>
        {toast.message && (
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-gray-700)' }}>{toast.message}</div>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-gray-500)', padding: '0', lineHeight: 1, fontSize: '1rem' }}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}

/* ─── Confirm Modal ───────────────────────────────────────────────────────── */
function ConfirmModal({ state, onClose }: { state: ModalState; onClose: () => void }) {
  if (!state.open) return null;

  const handleConfirm = () => {
    state.onConfirm?.();
    onClose();
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '460px' }}
      >
        <h2
          id="confirm-modal-title"
          style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-shark)', marginBottom: '0.75rem' }}
        >
          {state.title}
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--color-gray-700)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
          {state.message}
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className={`btn ${state.danger ? 'btn-danger' : 'btn-primary'}`}
          >
            {state.confirmLabel ?? 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Provider ────────────────────────────────────────────────────────────── */
export function UIProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [modal, setModal] = useState<ModalState>({ open: false, title: '', message: '' });

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((type: ToastType, title: string, message = '') => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev.slice(-4), { id, type, title, message }]);
    // Auto-dismiss after 5 s
    setTimeout(() => dismiss(id), 5000);
  }, [dismiss]);

  const confirm = useCallback((
    title: string,
    message: string,
    onConfirm: () => void,
    opts: { confirmLabel?: string; danger?: boolean } = {},
  ) => {
    setModal({ open: true, title, message, onConfirm, ...opts });
  }, []);

  const closeModal = useCallback(() => {
    setModal((prev) => ({ ...prev, open: false }));
  }, []);

  return (
    <UIContext.Provider value={{ toast, confirm }}>
      {children}

      {/* Toast stack — bottom-right */}
      <div
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          zIndex: 2000,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.625rem',
          alignItems: 'flex-end',
          pointerEvents: 'none',
        }}
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map((t) => (
          <div key={t.id} style={{ pointerEvents: 'all' }}>
            <ToastNotification toast={t} onDismiss={dismiss} />
          </div>
        ))}
      </div>

      {/* Confirm modal */}
      <ConfirmModal state={modal} onClose={closeModal} />
    </UIContext.Provider>
  );
}
