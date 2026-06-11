export function StatusDot({
  color,
  pulse = false,
  size = 8,
}: {
  color: string;
  pulse?: boolean;
  size?: number;
}) {
  return (
    <span
      className={pulse ? "badge-pulse inline-block rounded-full" : "inline-block rounded-full"}
      style={{ background: color, width: size, height: size }}
    />
  );
}
