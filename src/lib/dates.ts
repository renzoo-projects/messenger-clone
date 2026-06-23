export function toISO(d: string | Date | null | undefined): string | null {
  if (!d) return null
  return typeof d === "string" ? d : d.toISOString()
}

export function serializeDate(value: string | Date): string {
  return typeof value === "string" ? value : value.toISOString()
}

export function serializeNullableDate(value: string | Date | null | undefined): string | null {
  return toISO(value)
}
