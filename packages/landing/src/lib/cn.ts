export function cn(...classes: (string | boolean | undefined | null | string[])[]) {
  return classes
    .flat()
    .filter(Boolean)
    .join(' ')
}
