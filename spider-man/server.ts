import https from 'node:https'
import { getTime, sleep } from '@/utils'
import { IServerMovieInfo, IServerMovieItemInfo } from './types'

export async function fetchMovie(day: string) {
  return new Promise<IServerMovieItemInfo[]>((resolve, reject) => {
    const hostname = process.env.HOSTNAME
    const url = `${process.env.API_PREFIX}${process.env.API_DAY_MOVIE_LIST}`
    const options = {
      hostname: hostname,
      port: 443,
      path: `${url}?now=${day}`,
      headers: {
        Host: hostname,
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json',
        'Transfer-Encoding': 'chunked',
      },
    }
    https.get(options, (res) => {
      const data: Buffer[] = []
      res.on('data', (chunk) => {
        data.push(chunk)
      })
      res.on('end', () => {
        const res = JSON.parse(Buffer.concat(data).toString())
        resolve(res.data)
      })
    })
  })
}

export async function fetchMovieInfo(movieId: number) {
  return new Promise<IServerMovieInfo>((resolve, reject) => {
    const hostname = process.env.HOSTNAME
    const url = `${process.env.API_PREFIX}${process.env.API_MOVIE_INFO}`
    const options = {
      hostname: hostname,
      port: 443,
      path: `${url}/${movieId}`,
      headers: {
        Host: hostname,
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json',
        'Transfer-Encoding': 'chunked',
      },
    }
    https.get(options, (res) => {
      const data: Buffer[] = []
      res.on('data', (chunk) => {
        data.push(chunk)
      })
      res.on('end', () => {
        const res = JSON.parse(Buffer.concat(data).toString())
        resolve(res.data)
      })
    })
  })
}

export function queryMovieList(dayList: string[]) {
  return new Promise<IServerMovieItemInfo[]>(async (resolve, rejects) => {
    const allList: IServerMovieItemInfo[] = []
    for (const day of dayList) {
      const listSegment = await fetchMovie(day.replaceAll('-', '/'))
      for (const m of listSegment) {
        const otherInfo = await fetchMovieInfo(m.movieId)
        m.otherInfo = otherInfo
      }
      allList.push(...listSegment)
      await sleep(getTime(100, 500))
    }
    resolve(allList)
  })
}
