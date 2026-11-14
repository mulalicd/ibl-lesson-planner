import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PlanCard from '@/components/PlanCard';
import type { PlanCardData } from '@/lib/types';

const base: PlanCardData = {
  id: 'p1', subject: 'Biologija', grade: 5, topic: 'Fotosinteza', created_at: '2026-11-14T10:00:00Z',
  duration_min: 45, tier: 'MICRO', language: 'bosnian', inquiry_question: null, favourite: false, author: null,
};
const show = (p: PlanCardData) => render(<MemoryRouter><PlanCard plan={p} /></MemoryRouter>);

describe('P5 plan card', () => {
  it('shows the author name (P5-1b)', () => {
    show({ ...base, author: 'maja.ljubovic' });
    expect(screen.getByText('maja.ljubovic')).toBeInTheDocument();
  });
  it('shows no author line when the author is unknown', () => {
    const { container } = show(base);
    expect(container.querySelector('[title]')).toBeNull();
  });
  it('the star follows the teacher\'s own favourite (P5-2)', () => {
    const { container, rerender } = show(base);
    expect(container.querySelector('.fill-idss-gold')).toBeNull();
    rerender(<MemoryRouter><PlanCard plan={{ ...base, favourite: true }} /></MemoryRouter>);
    expect(container.querySelector('.fill-idss-gold')).not.toBeNull();
  });
});
