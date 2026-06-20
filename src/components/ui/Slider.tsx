'use client';

import * as RadixSlider from '@radix-ui/react-slider';

interface Props {
  id: string;
  label: string;
  /** Current value 0..100. */
  value: number;
  onValueChange: (value: number) => void;
  valueText: string;
}

/** Keyboard-operable slider with a spoken value via aria-valuetext. */
export function Slider({ id, label, value, onValueChange, valueText }: Props) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        <span className="text-sm tabular-nums text-[var(--color-ink-soft)]">{valueText}</span>
      </div>
      <RadixSlider.Root
        id={id}
        className="relative mt-2 flex h-5 w-full touch-none select-none items-center"
        value={[value]}
        min={0}
        max={100}
        step={5}
        onValueChange={(v) => onValueChange(v[0] ?? 0)}
        aria-label={label}
      >
        <RadixSlider.Track className="relative h-1.5 grow rounded-full bg-[var(--color-surface-2)]">
          <RadixSlider.Range className="absolute h-full rounded-full bg-[var(--color-primary)]" />
        </RadixSlider.Track>
        <RadixSlider.Thumb
          aria-valuetext={valueText}
          className="block h-5 w-5 rounded-full border-2 border-[var(--color-primary)] bg-white shadow"
        />
      </RadixSlider.Root>
    </div>
  );
}
