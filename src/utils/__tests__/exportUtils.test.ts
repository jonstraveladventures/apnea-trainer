import { Session } from '../../types';

// We need to test the CSV generation logic. Since exportToCSV triggers DOM side effects
// (Blob, URL.createObjectURL, link.click), we mock those and verify the CSV content.

// Mock DOM APIs
let capturedCSV = '';
const mockClick = jest.fn();
const mockRevokeObjectURL = jest.fn();

beforeEach(() => {
  capturedCSV = '';
  mockClick.mockClear();
  mockRevokeObjectURL.mockClear();

  // Mock Blob to capture CSV content
  global.Blob = jest.fn().mockImplementation((parts: string[]) => {
    capturedCSV = parts[0];
    return { size: parts[0].length, type: 'text/csv' };
  }) as unknown as typeof Blob;

  // Mock URL.createObjectURL / revokeObjectURL
  global.URL.createObjectURL = jest.fn().mockReturnValue('blob:mock-url');
  global.URL.revokeObjectURL = mockRevokeObjectURL;

  // Mock document.createElement to intercept link click
  const originalCreateElement = document.createElement.bind(document);
  jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    if (tag === 'a') {
      const el = originalCreateElement('a');
      el.click = mockClick;
      return el;
    }
    return originalCreateElement(tag);
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

// Import after mocks are set up
// eslint-disable-next-line @typescript-eslint/no-var-requires
const getExportToCSV = () => require('../exportUtils').exportToCSV;

describe('exportToCSV', () => {
  it('generates correct CSV headers and rows', () => {
    const sessions: Session[] = [
      {
        date: '2024-01-15',
        day: 'Monday',
        focus: 'CO₂ Tolerance',
        completed: true,
        actualMaxHold: 120,
        sessionTime: 900,
        notes: 'Great session',
      },
      {
        date: '2024-01-16',
        day: 'Tuesday',
        focus: 'Breath Control',
        completed: false,
        actualMaxHold: null,
        notes: '',
      },
    ];

    const exportToCSV = getExportToCSV();
    exportToCSV(sessions);

    expect(mockClick).toHaveBeenCalledTimes(1);
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');

    const lines = capturedCSV.split('\n');
    expect(lines[0]).toBe('Date,Day,Focus,Completed,Max Hold (s),Max Hold (formatted),Session Time (s),Notes');
    expect(lines[1]).toBe('2024-01-15,Monday,CO₂ Tolerance,Yes,120,02:00,900,Great session');
    expect(lines[2]).toBe('2024-01-16,Tuesday,Breath Control,No,,,,');
  });

  it('handles empty sessions array', () => {
    const exportToCSV = getExportToCSV();
    exportToCSV([]);

    expect(mockClick).toHaveBeenCalledTimes(1);

    const lines = capturedCSV.split('\n');
    expect(lines.length).toBe(1); // header only
    expect(lines[0]).toBe('Date,Day,Focus,Completed,Max Hold (s),Max Hold (formatted),Session Time (s),Notes');
  });

  it('escapes commas in notes field', () => {
    const sessions: Session[] = [
      {
        date: '2024-01-15',
        focus: 'O₂ Tolerance',
        completed: true,
        actualMaxHold: 90,
        notes: 'Felt good, very relaxed, no issues',
      },
    ];

    const exportToCSV = getExportToCSV();
    exportToCSV(sessions);

    const lines = capturedCSV.split('\n');
    // Commas in notes should be replaced with semicolons
    expect(lines[1]).toContain('Felt good; very relaxed; no issues');
    // The notes field itself should not introduce extra CSV columns
    const columns = lines[1].split(',');
    expect(columns.length).toBe(8);
  });
});
