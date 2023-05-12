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
const hostname = process.env.API_HOSTNAME
const prefix = process.env.API_PREFIX

const iaxios = axios.create({
  baseURL: `https://${hostname}${prefix}`,
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
    url: `/movieCinemaDate/new`,
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
  return response.data.data
}

export async function queryMovieInfo(movieId: number) {
  const response = await iaxios<ResWrap<IServerMovieInfo | null>>({
    url: `/movieInfo/${movieId}`,
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
    await sleep(getTime(100, 500))
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
