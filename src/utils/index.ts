import fsPromise from 'node:fs/promises'

export function getDayList(
  year: string,
  month: string,
  days: number = 31,
): string[] {
  return new Array(days).fill('').map((_, index) => {
    const monthFormat = month.padStart(2, '0')
    const dayFormat = String(index + 1).padStart(2, '0')
    return `${year}-${monthFormat}-${dayFormat}`
  })
}

// [min, max]
export function getTime(min: number, max: number) {
  return min + Math.round(Math.random() * (max - min))
}

// staus n time
export function sleep(time: number = 1000) {
  return new Promise((resolve) => {
    setTimeout(resolve, time)
  })
}

export async function wFile(string: string, path: string) {
  return fsPromise.writeFile(path, string)
}
