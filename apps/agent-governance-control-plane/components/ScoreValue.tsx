/**
 * Renders a "value/total" score pair with an explicit LTR direction
 * override, so the pair never visually reverses (e.g. "38/100" rendering
 * as "100/38") when placed inside an RTL document.
 */
export function ScoreValue({ value, total = 100 }: { value: number; total?: number }) {
  return (
    <span dir="ltr" className="inline-block tabular-nums">
      {value}/{total}
    </span>
  );
}
