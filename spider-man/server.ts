import https from 'node:https'
import dotent from 'dotenv'

import { getTime, sleep } from '@/utils'
import {
  IMovieInfoList,
  IPlayTimeList,
  IServerMovieInfo,
  IServerMovieItem,
} from './types'

dotent.config()

const hostname = process.env.HOSTNAME
const prefix = process.env.API_PREFIX

export async function fetchMovie(day: string) {
  return new Promise<IServerMovieItem[]>((resolve, reject) => {
    const options = {
      hostname: hostname,
      port: 443,
      path: `${prefix}/movieCinemaList?now=${day}`,
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
    const options = {
      hostname: hostname,
      port: 443,
      path: `${prefix}/movieInfo/${movieId}`,
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

export async function queryMovieList(dayList: string[], now: number) {
  const allList: IServerMovieItem[] = []
  for (const day of dayList) {
    const listSegment = await fetchMovie(day.replaceAll('-', '/'))
    allList.push(...listSegment)
    await sleep(getTime(100, 500))
  }
  return {
    updateTime: now,
    list: allList,
  }
}
export async function queryMovieInfoMap(
  movieList: IServerMovieItem[],
  now: number,
) {
  const movieInfoMap: IMovieInfoList = {
    updateTime: now,
  }
  for (const m of movieList) {
    const info = await fetchMovieInfo(m.movieId)
    movieInfoMap[m.movieId] = info
    await sleep(getTime(100, 500))
  }
  return movieInfoMap
}

/**
 *
 * @returns {dayList: '2023-04-15'[], month: ['9', undefined]}
 */
export async function fetchPlayTimeList() {
  return new Promise<{
    dayList: string[]
    month: (undefined | string)[]
  }>((resolve, reject) => {
    const options = {
      hostname: hostname,
      port: 443,
      path: `${prefix}/movieCinemaDate/new`,
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
        const resData: IPlayTimeList = res.data
        const dayList: string[] = []
        resData.currentMonth?.cinemaDateDtoList.forEach((m) => {
          dayList.push(m.playTime)
        })
        resData.nextMonth?.cinemaDateDtoList.forEach((m) => {
          dayList.push(m.playTime)
        })
        const month = [resData.currentMonth?.month, resData.nextMonth?.month]
        resolve({
          dayList,
          month,
        })
      })
    })
  })
}
