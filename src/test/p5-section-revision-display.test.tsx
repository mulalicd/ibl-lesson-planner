import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import PlanDisplay from '@/components/PlanDisplay';
import { findSectionRange } from '@/lib/sectionRevision';

// The v9 sample plan of the display regression test (p3-quality), so both tests read the same plan.
const src = readFileSync(resolve(__dirname, 'p3-quality.test.tsx'), 'utf8');
const V9_PLAN = src.match(/const V9_PLAN = `([\s\S]*?)`;/)![1];

describe('P5-4 every section card maps back to its lines in the plan text', () => {
  it('each title PlanDisplay shows is found, with the next title as its end', () => {
    const { container } = render(<PlanDisplay planText={V9_PLAN} />);
    const titles = [...container.querySelectorAll('h2')].map((h) => h.textContent ?? '');
    expect(titles.length).toBeGreaterThanOrEqual(5);
    const seen = new Map<string, number>();
    titles.forEach((title, i) => {
      const occurrence = seen.get(title) ?? 0;
      seen.set(title, occurrence + 1);
      const r = findSectionRange(V9_PLAN, { title, nextTitle: titles[i + 1] ?? null, occurrence });
      expect(r, `section "${title}" not found`).not.toBeNull();
    });
  });
});

import { fireEvent, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

describe('P5-4 the "Prepravi ovaj dio" button', () => {
  it('is shown only when the page allows revisions', () => {
    const { unmount } = render(<PlanDisplay planText={V9_PLAN} />);
    expect(screen.queryAllByText('Prepravi ovaj dio')).toHaveLength(0);
    unmount();
    render(<PlanDisplay planText={V9_PLAN} onReviseSection={async () => {}} />);
    expect(screen.getAllByText('Prepravi ovaj dio').length).toBeGreaterThanOrEqual(5);
  });

  it('sends the clicked section and the teacher\'s request', async () => {
    const onRevise = vi.fn(async () => {});
    const { container } = render(<PlanDisplay planText={V9_PLAN} onReviseSection={onRevise} />);
    const titles = [...container.querySelectorAll('h2')].map((h) => h.textContent ?? '');
    fireEvent.click(screen.getAllByText('Prepravi ovaj dio')[1]);
    fireEvent.change(screen.getByPlaceholderText('Šta želite promijeniti? (nije obavezno)'), { target: { value: 'kraće' } });
    fireEvent.click(screen.getByText('Prepravi'));
    await waitFor(() => expect(onRevise).toHaveBeenCalledTimes(1));
    expect(onRevise).toHaveBeenCalledWith({ title: titles[1], nextTitle: titles[2] ?? null, occurrence: 0 }, 'kraće');
  });
});
