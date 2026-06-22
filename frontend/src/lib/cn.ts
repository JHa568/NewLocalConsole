type ClassValue = string | false | null | undefined;

/** Join truthy class strings with spaces. Keeps Tailwind class lists readable. */
export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(" ");
}
