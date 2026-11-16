const TINTS = [
  '#bf4535',
  '#c97e22',
  '#2c5443',
  '#3e6e8e',
  '#7a4e7e',
  '#8a5a2b',
  '#b24468',
  '#4c7a5a',
]

export function tintFor(id: string): string {
  let hash = 0
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) >>> 0
  }
  return TINTS[hash % TINTS.length]
}

export function initialsFor(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'

  const first = words[0][0] ?? ''
  const second =
    words.length > 1 ? (words[words.length - 1][0] ?? '') : (words[0][1] ?? '')
  return `${first}${second}`.toUpperCase()
}
