import { render, screen } from '@testing-library/react';
import LensMark from './LensMark';
import ScanLoader from './ScanLoader';
import AuthLayout from './AuthLayout';

test('draws the lens as a decorative image, with a sweep only while scanning', () => {
  const { container, rerender } = render(<LensMark />);
  const svg = container.querySelector('svg.lens-mark');
  expect(svg).toHaveAttribute('aria-hidden', 'true');
  expect(container.querySelector('.lens-sweep')).not.toBeInTheDocument();

  rerender(<LensMark scanning />);
  expect(container.querySelector('svg.lens-mark')).toHaveClass('is-scanning');
  expect(container.querySelector('.lens-sweep')).toBeInTheDocument();
});

test('announces the scan loader to screen readers', () => {
  const { container } = render(<ScanLoader />);
  expect(screen.getByRole('status')).toHaveTextContent('Loading scan...');
  expect(container.querySelector('.lens-sweep')).toBeInTheDocument();
});

test('wraps auth forms with the shared brand, lens and tagline', () => {
  render(<AuthLayout><p>Form here</p></AuthLayout>);
  expect(screen.getByRole('heading', { name: 'SecuLens' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Security insights, in focus.' })).toBeInTheDocument();
  expect(screen.getByText('Form here')).toBeInTheDocument();
});
