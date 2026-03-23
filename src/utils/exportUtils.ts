import { Session } from '../types';
import { formatTime } from './trainingLogic';

export function exportToCSV(sessions: Session[]): void {
  const headers = ['Date', 'Day', 'Focus', 'Completed', 'Max Hold (s)', 'Max Hold (formatted)', 'Session Time (s)', 'Notes'];
  const rows = sessions.map(s => [
    s.date,
    s.day || '',
    s.focus,
    s.completed ? 'Yes' : 'No',
    s.actualMaxHold?.toString() || '',
    s.actualMaxHold ? formatTime(s.actualMaxHold) : '',
    s.sessionTime?.toString() || '',
    (s.notes || '').replace(/,/g, ';') // escape commas
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `apnea-training-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportToPDF(sessions: Session[]): void {
  const completedSessions = sessions.filter(s => s.completed);
  const maxHoldSessions = sessions.filter(s => s.actualMaxHold && s.actualMaxHold > 0);
  const bestMaxHold = maxHoldSessions.length > 0 ? Math.max(...maxHoldSessions.map(s => s.actualMaxHold!)) : 0;

  const html = `<!DOCTYPE html><html><head><title>Apnea Training Report</title>
  <style>
    body { font-family: -apple-system, system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; color: #1a1a1a; }
    h1 { color: #0284c7; border-bottom: 2px solid #0284c7; padding-bottom: 8px; }
    h2 { color: #334155; margin-top: 24px; }
    .stats { display: flex; gap: 24px; margin: 16px 0; }
    .stat { background: #f1f5f9; padding: 16px; border-radius: 8px; text-align: center; flex: 1; }
    .stat-value { font-size: 24px; font-weight: bold; color: #0284c7; }
    .stat-label { font-size: 12px; color: #64748b; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
    th { background: #0284c7; color: white; padding: 8px 12px; text-align: left; }
    td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; }
    tr:nth-child(even) { background: #f8fafc; }
    .completed { color: #16a34a; } .incomplete { color: #94a3b8; }
    @media print { body { margin: 0; } }
  </style></head><body>
  <h1>Apnea Training Report</h1>
  <p>Generated: ${new Date().toLocaleDateString()}</p>
  <div class="stats">
    <div class="stat"><div class="stat-value">${completedSessions.length}/${sessions.length}</div><div class="stat-label">Sessions Completed</div></div>
    <div class="stat"><div class="stat-value">${bestMaxHold ? formatTime(bestMaxHold) : 'N/A'}</div><div class="stat-label">Best Max Hold</div></div>
    <div class="stat"><div class="stat-value">${Math.round((completedSessions.length / Math.max(sessions.length, 1)) * 100)}%</div><div class="stat-label">Completion Rate</div></div>
  </div>
  <h2>Training Log</h2>
  <table><thead><tr><th>Date</th><th>Focus</th><th>Status</th><th>Max Hold</th><th>Notes</th></tr></thead><tbody>
  ${sessions.map(s => `<tr><td>${s.date}</td><td>${s.focus}</td><td class="${s.completed ? 'completed' : 'incomplete'}">${s.completed ? 'Completed' : 'Pending'}</td><td>${s.actualMaxHold ? formatTime(s.actualMaxHold) : '-'}</td><td>${s.notes || '-'}</td></tr>`).join('')}
  </tbody></table>
  </body></html>`;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  }
}
