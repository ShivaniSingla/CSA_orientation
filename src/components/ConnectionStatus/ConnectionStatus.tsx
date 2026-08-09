import { useConnectionStatus } from '../../hooks/useRealtime';

export function ConnectionStatus() {
  const status = useConnectionStatus();

  const config = {
    connected: { label: 'LIVE', className: 'status-connected' },
    reconnecting: { label: 'RECONNECTING', className: 'status-reconnecting' },
    offline: { label: 'OFFLINE', className: 'status-offline' },
  };

  const { label, className } = config[status];

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded bg-cyber-darker/80 backdrop-blur border border-cyber-border">
      <span className={`status-dot ${className}`} />
      <span className="font-mono text-xs tracking-wider text-cyber-muted">{label}</span>
    </div>
  );
}
