import dotent from 'dotenv'
import axios, { AxiosResponse } from 'axios'

import { createBar, getTime, sleep } from '@moviecal/utils'
import {
  IMovieInfoList,
  IPlayTimeList,
  IServerMovieInfo,
  IServerMovieItem,
} from '../types'
import { appMessagePushEmail } from '../export/message-push'
import chalk from 'chalk'

dotent.config()

export type ResWrap<T> = {
  code: number // 0 success | 1 | 500 | 45100
  data: T
  msg: string
}
export const hostname = process.env.API_HOSTNAME
const prefix = process.env.API_PREFIX
const prefix2 = process.env.API_PREFIX_2

const iaxios = axios.create({
  baseURL: `https://${hostname}`,
})

iaxios.interceptors.response.use(
  async function (response: AxiosResponse<ResWrap<unknown>, unknown>) {
    // if (response.data.code !== 0) {
    //   // TODO: throw error or (muite and setting default value)
    //   await appMessagePushEmail({
    //     type: 'error',
    //     msg: response.data.msg,
    //     json: JSON.stringify({
    //       url: response.config.url,
    //       requestData: response.config.data,
    //       responseData: JSON.stringify(response.data),
    //     }),
    //   })
    // }
    return response
  },
  async function (error) {
    await appMessagePushEmail({
      type: 'error',
      msg: error?.message,
      json: JSON.stringify({
        message: error?.message,
        stack: error?.stack,
        // ...error,
      }),
    })
    return Promise.reject(error)
  },
)

/**
 * @returns {dayList: '2023-04-15'[], month: ['9', undefined]}
 */
export async function queryPlayDayList(): Promise<{
  dayList: string[]
  month: (undefined | string)[]
}> {
  const response = await iaxios<ResWrap<IPlayTimeList>>({
    url: `${prefix}/movieCinemaDate/new`,
  })
  const resData = response.data.data
  const dayList: string[] = []
  resData.currentMonth?.cinemaDateDtoList.forEach((m) => {
    dayList.push(m.playTime)
  })
  resData.nextMonth?.cinemaDateDtoList.forEach((m) => {
    dayList.push(m.playTime)
  })
  const month = [resData.currentMonth?.month, resData.nextMonth?.month]
  console.log(chalk.green('[完成]'), '排片日期')
  if (process.env.API_ENV !== 'PRD') {
    const startDay = dayList.slice(0, 2)
    console.log('测试开发环境只拉取2天', startDay.join(', '))

    return {
      month,
      dayList: startDay,
    }
  }
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
    url: `${prefix}/movieCinemaList`,
    params: { now: day },
  })
  return response.data.data
}

export async function queryMovieInfo(movieId: number) {
  const response = await iaxios<ResWrap<IServerMovieInfo | null>>({
    url: `${prefix}/movieInfo/${movieId}`,
  })
  return response.data.data
}

const barList = createBar('排片')
export async function getMovieList(dayList: string[], now: number) {
  barList.start(dayList.length, 0, {
    label: 'day',
    val: '',
  })
  const allList: IServerMovieItem[] = []
  for (const day of dayList) {
    const listSegment = await queryMovie(day.replaceAll('-', '/'))
    allList.push(...listSegment)
    barList.increment({
      val: day,
    })
    await sleep(getTime(500, 500))
  }
  barList.stop()
  return {
    updateTime: now,
    list: allList,
  }
}

const barInfo = createBar('详情')
export async function getMovieInfoMap(
  movieList: IServerMovieItem[],
  now: number,
) {
  const movieInfoMap: IMovieInfoList = {
    updateTime: now,
  }

  barInfo.start(movieList.length, 0, {
    label: 'movie',
    val: '',
  })
  for (const m of movieList) {
    const info = await queryMovieInfo(m.movieId)
    if (info == null) continue
    movieInfoMap[m.movieId] = info

    barInfo.increment({
      val: m.movieName,
    })
    await sleep(getTime(100, 500))
  }

  barInfo.stop()
  return movieInfoMap
}

interface MovieLibrryInfo {
  movieId: number
  movieName: string
  intro: string // 简介
  movieCateList: {
    categoryId: number
    categoryName: string
    categoryNameEn?: string
    type?: unknown
  }[]
  realName: string // 貌似是导演或演员
  movieTime: string // 2023-04-23 00:00:00
  languageCategoryNameList: {
    categoryId: number
    categoryName: string // 中文/英语
    categoryNameEn: string // Chinese
    type: number
  }[]
}
export async function queryMovieLibrryInfo(movieId: number) {
  const response = await iaxios<ResWrap<MovieLibrryInfo>>({
    url: `${prefix2}/movieLibrryInfo/${movieId}`,
  })
  return response.data.data
}

interface Actor {
  position: string // 演员/导演
  photo: string
  realName: string // 杨鸽、巴斯·德沃斯
  portrayName: string // 主持人
  imaginedId?: unknown
}
export async function queryMovieActorList(movieId: number) {
  const response = await iaxios<ResWrap<Actor[]>>({
    url: `${prefix2}/movieActorList/${movieId}`,
  })
  return response.data.data
}

interface VideoInfo {
  prevue: string // 视频源地址
  duration: string // 17:45
  title: string // 《小世界》映后交流
}
export async function queryMovieTrailerList(movieId: number) {
  const response = await iaxios<ResWrap<VideoInfo[]>>({
    url: `${prefix2}/movieTrailerList/${movieId}`,
  })
  return response.data.data
}
