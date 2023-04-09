import dotent from 'dotenv'
import axios from 'axios'

import { getTime, sleep } from '@/utils'
import {
  IMovieInfoList,
  IPlayTimeList,
  IServerMovieInfo,
  IServerMovieItem,
} from './types'

dotent.config()

type ResWrap<T> = {
  code: 0 | 1
  data: T
  msg: string
}
const hostname = process.env.HOSTNAME
const prefix = process.env.API_PREFIX

const iaxios = axios.create({
  baseURL: `https://${hostname}${prefix}`,
})

/**
 * @returns {dayList: '2023-04-15'[], month: ['9', undefined]}
 */
export async function queryPlayDayList(): Promise<{
  dayList: string[]
  month: (undefined | string)[]
}> {
  // TODO: 怎么使用 ts 同时限制返回值和传入类型
  const response = await iaxios<ResWrap<IPlayTimeList>>({
    url: `/movieCinemaDate/new`,
  })
  const body = response.data
  const resData = body.data
  const dayList: string[] = []
  resData.currentMonth?.cinemaDateDtoList.forEach((m) => {
    dayList.push(m.playTime)
  })
  resData.nextMonth?.cinemaDateDtoList.forEach((m) => {
    dayList.push(m.playTime)
  })
  const month = [resData.currentMonth?.month, resData.nextMonth?.month]
  return {
    month,
    dayList,
  }
}

/**
 * @param day '2023/05/06' | '2023/5/6'
 */
export async function queryMovie(day: string) {
  const response = await iaxios<ResWrap<IServerMovieItem[]>>({
    url: `/movieCinemaList`,
    params: { now: day },
  })
  // TODO: 处理code 500服务器异常
  return response.data.data
}

export async function queryMovieInfo(movieId: number) {
  const response = await iaxios<ResWrap<IServerMovieInfo>>({
    url: `/movieInfo/${movieId}`,
  })
  return response.data.data
}

export async function getMovieList(dayList: string[], now: number) {
  const allList: IServerMovieItem[] = []
  for (const day of dayList) {
    const listSegment = await queryMovie(day.replaceAll('-', '/'))
    allList.push(...listSegment)
    await sleep(getTime(100, 500))
  }
  return {
    updateTime: now,
    list: allList,
  }
}
export async function getMovieInfoMap(
  movieList: IServerMovieItem[],
  now: number,
) {
  const movieInfoMap: IMovieInfoList = {
    updateTime: now,
  }
  for (const m of movieList) {
    const info = await queryMovieInfo(m.movieId)
    movieInfoMap[m.movieId] = info
    await sleep(getTime(100, 500))
  }
  return movieInfoMap
}
