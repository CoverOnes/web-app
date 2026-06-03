type LogoVariant = 'blue' | 'purple' | 'orange' | 'amber' | 'green' | 'cyan' | 'indigo' | 'rose';

interface LogoSquareProps {
  letter: string;
  variant?: LogoVariant;
  size?: 30 | 36 | 38 | 52 | 56;
}

const VARIANT_CLASSES: Record<LogoVariant, string> = {
  blue:   'co-lg-blue',
  purple: 'co-lg-purple',
  orange: 'co-lg-orange',
  amber:  'co-lg-amber',
  green:  'co-lg-green',
  cyan:   'co-lg-cyan',
  indigo: 'co-lg-indigo',
  rose:   'co-lg-rose',
};

/** Deterministically pick a variant from a string so the same company always gets the same colour. */
function pickVariant(letter: string): LogoVariant {
  const variants: LogoVariant[] = ['blue', 'purple', 'orange', 'amber', 'green', 'cyan', 'indigo', 'rose'];
  const idx = letter.toUpperCase().charCodeAt(0) % variants.length;
  return variants[idx];
}

export function LogoSquare({ letter, variant, size = 36 }: LogoSquareProps) {
  const resolvedVariant = variant ?? pickVariant(letter);
  const fontSize = Math.round(size * 0.38);

  return (
    <div
      className={`co-lg ${VARIANT_CLASSES[resolvedVariant]}`}
      style={{ width: size, height: size, fontSize }}
      aria-hidden="true"
    >
      {letter.charAt(0).toUpperCase()}
    </div>
  );
}

export default LogoSquare;
