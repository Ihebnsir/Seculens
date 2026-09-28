import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import ScanHistory from './ScanHistory';

const scan = { id: 'scan-1', target: 'https://example.com', score: 80, createdAt: '2026-09-28T10:00:00Z', findingsCount: 3 };
const json = (body, status = 200) => Promise.resolve({ ok: status < 300, status, json: async () => body });

// Faux backend : liste des scans, puis suppression.
function mockBackend() {
  global.fetch = jest.fn((url, options = {}) => {
    if (options.method === 'DELETE') return json(null, 204);
    return json([scan]);
  });
}

async function renderHistory(onDeleteScan = jest.fn()) {
  render(<ScanHistory refreshKey={0} onSelectScan={jest.fn()} onDeleteScan={onDeleteScan} />);
  return screen.findByRole('button', { name: 'Delete scan for https://example.com' });
}

beforeEach(() => {
  mockBackend();
  jest.spyOn(window, 'confirm');
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

test('asks for confirmation inside the row instead of a browser dialog, and cancels back to the trash button', async () => {
  fireEvent.click(await renderHistory());

  expect(window.confirm).not.toHaveBeenCalled();
  expect(screen.getByText('Delete this scan?')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();

  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(screen.queryByText('Delete this scan?')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Delete scan for https://example.com' })).toHaveFocus();
});

test('cancels the confirmation on Escape and on a click elsewhere', async () => {
  fireEvent.click(await renderHistory());
  fireEvent.keyDown(screen.getByRole('button', { name: 'Cancel' }), { key: 'Escape' });
  expect(screen.queryByText('Delete this scan?')).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Delete scan for https://example.com' }));
  fireEvent.pointerDown(document.body);
  expect(screen.queryByText('Delete this scan?')).not.toBeInTheDocument();
});

test('cancels the confirmation by itself after a few seconds', async () => {
  const trash = await renderHistory();
  jest.useFakeTimers();
  fireEvent.click(trash);
  expect(screen.getByText('Delete this scan?')).toBeInTheDocument();

  act(() => { jest.advanceTimersByTime(5000); });
  expect(screen.queryByText('Delete this scan?')).not.toBeInTheDocument();
});

test('shows the live score of the open scan, without reloading the list', async () => {
  const { rerender } = render(
    <ScanHistory refreshKey={0} activeScanId="scan-1" activeScanScore={80} onSelectScan={jest.fn()} onDeleteScan={jest.fn()} />
  );
  expect(await screen.findByText('80')).toBeInTheDocument();
  const listCalls = global.fetch.mock.calls.length;

  // Un finding vient d'être coché "Fixed" : le score du scan ouvert passe à 85.
  rerender(<ScanHistory refreshKey={0} activeScanId="scan-1" activeScanScore={85} onSelectScan={jest.fn()} onDeleteScan={jest.fn()} />);
  expect(screen.getByText('85')).toBeInTheDocument();
  expect(global.fetch.mock.calls.length).toBe(listCalls);
});

test('deletes the scan once confirmed', async () => {
  const onDeleteScan = jest.fn();
  fireEvent.click(await renderHistory(onDeleteScan));
  fireEvent.click(screen.getByRole('button', { name: 'Yes, delete the scan for https://example.com' }));

  await waitFor(() => expect(onDeleteScan).toHaveBeenCalledWith('scan-1'));
  const deleteCall = global.fetch.mock.calls.find(([, options = {}]) => options.method === 'DELETE');
  expect(deleteCall[0]).toMatch(/\/scans\/scan-1$/);
});
