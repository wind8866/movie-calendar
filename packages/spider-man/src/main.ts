import dotent from 'dotenv'
import chalk from 'chalk'
import dayjs from 'dayjs'

import { IMovieInfo, IAllData } from './types'
import { getDoubanDataUseCache } from './server/douban'
import { queryPlayDayList, getMovieInfoMap, getMovieList } from './server/cfa'
import { config } from './config'
import { createAlarm, createCalData, createCalendar } from './export/to-ics'
import toCSV from './export/to-csv'
import { appMessagePushEmail, addedMovieMsgPush } from './export/message-push'
import {
  pullMovieList,
  putMovieList,
  putCSV,
  putCal,
  putAddedNewMovieList,
  putAllData,
} from './server/oss'

dotent.config()

async function diffMovieList(movieList: IMovieInfo[]) {
  const movieListOld = await pullMovieList()
  const movieMap: { [k: string]: IMovieInfo } = {}
  movieListOld.forEach((m) => {
    movieMap[`${m.movieId}-${m.playTime}`] = m
  })
  return movieList.filter((m) => {
    return !movieMap[`${m.movieId}-${m.playTime}`]
  })
}

export function getSaleTimeSet(movieList: IMovieInfo[]) {
  const saleTimeSet = new Set<string>()
  movieList.forEach((movie) => {
    movie.movieCinemaListMore?.forEach((data) => {
      saleTimeSet.add(data.movieActiveDto.saleTime)
    })
  })
  return saleTimeSet
}

export async function getAllData(): Promise<IAllData> {
  const now = Date.now()
  const playDate = await queryPlayDayList()
  const movieListRaw = await getMovieList(playDate.dayList, now)
  const movieInfoMapRaw = await getMovieInfoMap(movieListRaw.list, now)
  const movieList: IMovieInfo[] = combineData({ movieListRaw, movieInfoMapRaw })

  const { cfaToDou, douToCFA } = await getDoubanDataUseCache(movieList, now)

  const noDouInfo: {
    movieId: number
    name: string
    movieTime: string
  }[] = []
  movieList.forEach(async (m) => {
    if (cfaToDou[m.movieId]) {
      m.doubanInfo = cfaToDou[m.movieId]
    } else {
      const simpleInfo = {
        movieId: m.movieId,
        name: m.name,
        movieTime: m.movieTime,
      }
      console.warn(chalk.yellow('[豆瓣信息]'), JSON.stringify(simpleInfo))
      noDouInfo.push(simpleInfo)
    }
  })
  if (noDouInfo.length > 0) {
    await appMessagePushEmail({
      type: 'warn',
      msg: '没有查询到豆瓣信息',
      json: JSON.stringify(noDouInfo),
    })
  }
  const addedMovie = await diffMovieList(movieList)
  const saleTimeList = getSaleTimeSet(movieList)

  return {
    now,
    playDate,
    cfaToDou,
    douToCFA,
    movieList,
    movieListRaw,
    movieInfoMapRaw,
    saleTimeList,
    addedMovie,
  }
}

interface CombineDataProps {
  movieListRaw: Awaited<ReturnType<typeof getMovieList>>
  movieInfoMapRaw: Awaited<ReturnType<typeof getMovieInfoMap>>
}
function combineData({
  movieListRaw,
  movieInfoMapRaw,
}: CombineDataProps): IMovieInfo[] {
  return movieListRaw.list.map((movie) => {
    const movieId = movie.movieId
    const otherDate: string[] = []
    movieInfoMapRaw[movieId]?.movieCinemaList.forEach((info) => {
      otherDate.push(info.playTime)
    })
    const countryList = movieInfoMapRaw[movieId]?.regionCategoryNameList.map(
      (info) => info.categoryName,
    )

    const regionCategoryNameList = movieInfoMapRaw[
      movieId
    ]?.regionCategoryNameList.map((info) => ({
      categoryName: info.categoryName,
    }))
    const movieCinemaListMore = movieInfoMapRaw[movieId]?.movieCinemaList.map(
      (info) => ({
        saleTime: info.saleTime,
        playTime: info.playTime,
        movieActiveDto: info.movieActiveDto,
        seatTotal: info.seatTotal,
        seatSold: info.seatSold,
      }),
    )
    let soldOut = false
    movieCinemaListMore.forEach((info) => {
      if (info.playTime === movie.playTime) {
        if (info.seatSold === 0) {
          soldOut = true
        }
      }
      config.saleTime.add(info.saleTime)
    })
    const movieInfo: IMovieInfo = {
      movieId: movie.movieId,
      name: movie.movieName,
      minute: movie.movieMinute,
      cinema: movie.cinemaName as IMovieInfo['cinema'],
      room: movie.movieHall,
      playTime: movie.playTime,
      price: movie.fares,
      isActivity: movie.isActivity === '1',
      movieCateList: movie.movieCateList,
      movieCinemaList: movie.movieCinemaList,
      movieActorList: movie.movieActorList,
      movieTime: movie.movieTime,
      soldOut,
      otherDate,
      country: countryList,
      regionCategoryNameList,
      movieCinemaListMore: movieCinemaListMore,
      topicName: movieInfoMapRaw[movieId]?.topic?.[0]?.title,
    }
    return movieInfo
  })
}
export async function completeProcess() {
  const allData = await getAllData()
  const { addedMovie, movieList, playDate } = allData
  await putAllData(allData)

  if (addedMovie.length > 0) {
    await putAddedNewMovieList(addedMovie)
    await addedMovieMsgPush(movieList)
    const csvStr = toCSV(movieList)
    putCSV(csvStr)
  }
  await putMovieList(movieList)

  // 全部
  {
    const calObject = createCalData(movieList)
    const calAlert = createAlarm()
    const calString = await createCalendar(calObject.concat(calAlert))
    putCal(calString)
  }

  // 小西天
  {
    const calObject = createCalData(
      movieList.filter((m) => m.cinema === '小西天艺术影院'),
      'xiaoxitian',
    )
    const calAlert = createAlarm({
      title: '资料馆电影日历(小西天)',
    })
    const calString = await createCalendar(calObject.concat(calAlert))
    putCal(calString, 'xiaoxitian')
  }
  // 百子湾
  {
    const calObject = createCalData(
      movieList.filter((m) => m.cinema === '百子湾艺术影院'),
      'baiziwan',
    )
    const calAlert = createAlarm({
      title: '资料馆电影日历(百子湾)',
    })
    const calString = await createCalendar(calObject.concat(calAlert))
    putCal(calString, 'baiziwan')
  }

  console.log(chalk.bold.green('[结束]'), '完成所有流程')
}
