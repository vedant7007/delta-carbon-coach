import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PeriodToggle } from '@/components/ui/PeriodToggle';

describe('component accessibility (axe)', () => {
  it('Button has no violations', async () => {
    const { container } = render(<Button>Save entry</Button>);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('a labelled form Card has no violations', async () => {
    const { container } = render(
      <Card>
        <h2>Add manually</h2>
        <label htmlFor="amt">Amount</label>
        <input id="amt" type="number" />
        <Button>Add</Button>
      </Card>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('PeriodToggle radiogroup has no violations', async () => {
    const { container } = render(
      <PeriodToggle value="week" onChange={() => {}} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
