// Russian plural forms for counters (docs/ux/content-rules.md «Числа и склонения»).
export function plural(count: number, one: string, few: string, many: string): string {
  const last = count % 10, teens = count % 100
  if (last === 1 && teens !== 11) return one
  if (last >= 2 && last <= 4 && (teens < 12 || teens > 14)) return few
  return many
}

export const itemsWord = (count: number) => plural(count, 'пункт', 'пункта', 'пунктов')
