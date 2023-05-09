import chalk from 'chalk'
import fsPromise from 'node:fs/promises'
import cliProgress from 'cli-progress'

export function getDayList(year: string, month: string, days = 31): string[] {
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
export function sleep(time = 1000) {
  return new Promise((resolve) => {
    setTimeout(resolve, time)
  })
}

type FormatOptions = cliProgress.Options & {
  barCompleteString: string
  barIncompleteString: string
  barsize: number
}
export function createBar(title: string) {
  return new cliProgress.SingleBar(
    {
      // TODO: PR @types/nodemailer upgrade to ^6.9.1
      // @ts-ignore
      format: (options: FormatOptions, params, payload) => {
        const tag =
          params.value === params.total
            ? chalk.green(`[${title}]`)
            : chalk.yellowBright(`[${title}]`)
        const progress = Math.round(params.progress * options.barsize)
        const bar =
          options.barCompleteString.substr(0, progress) +
          options.barIncompleteString.substr(0, options.barsize - progress)
        const rate = Math.ceil(params.progress * 100)

        return `${tag} ${bar} ${rate}% | ${params.value}/${params.total} Chunks | ${payload.label}: ${payload.val}`
      },
      hideCursor: true,
    },
    cliProgress.Presets.shades_classic,
  )
}
