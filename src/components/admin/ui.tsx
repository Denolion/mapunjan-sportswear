import { ReactNode, useEffect } from 'react';
import { CheckCircle2, XCircle, X, AlertTriangle } from 'lucide-react';

export function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`admin-toast admin-toast-${type}`}>
      {type === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
      <span>{message}</span>
      <button onClick={onClose}><X size={14} /></button>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  destructive,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="admin-modal-overlay" onClick={onCancel}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-icon">
          <AlertTriangle size={28} />
        </div>
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="admin-modal-actions">
          <button className="admin-btn admin-btn-ghost" onClick={onCancel}>Cancel</button>
          <button className={destructive ? 'admin-btn admin-btn-danger' : 'admin-btn admin-btn-dark'} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

export function Loading({ label }: { label?: string }) {
  return (
    <div className="admin-loading">
      <span className="admin-spinner" />
      {label || 'Loading...'}
    </div>
  );
}

export function EmptyState({ icon, title, message, action }: { icon: ReactNode; title: string; message: string; action?: ReactNode }) {
  return (
    <div className="admin-empty">
      <div className="admin-empty-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{message}</p>
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="admin-error-state">
      <XCircle size={28} />
      <p>{message}</p>
      {onRetry && <button className="admin-btn admin-btn-dark" onClick={onRetry}>Try again</button>}
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="admin-page-loader">
      <span className="admin-spinner" />
    </div>
  );
}
