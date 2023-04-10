import dotent from 'dotenv'
import 'colors/safe'

import { IMovieInfo, IAllData } from './types'
import { getDoubanData, getDoubanInfoMap, getDouToZLG } from './server-douban'
import { queryPlayDayList, getMovieInfoMap, getMovieList } from './server-zlg'
import {
  doubanDataPutOSS,
  pullMovieList,
  pullOSS,
  pushOSS,
  putCSV,
  putCal,
} from './server-oss'
import { config } from './config'
import { createAlarm, createCalData, createCalendar } from './to-ics'
import toCSV from './to-csv'

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

  const { doubanInfoMapAll, doubanInfoMap, douToZlg } = await getDoubanData(
    movieList,
    now,
  )

  movieList.forEach((m) => {
    if (doubanInfoMapAll[m.movieId]) {
      m.doubanInfo = doubanInfoMapAll[m.movieId]
    }
  })

  const addedMovie = await diffMovieList(movieList)
  const saleTimeList = getSaleTimeSet(movieList)

  return {
    now,
    playDate,
    doubanInfoMap,
    doubanInfoMapAll,
    douToZlg,
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
      }),
    )

    const movieInfo: IMovieInfo = {
      movieId: movie.movieId,
      name: movie.movieName,
      minute: movie.movieMinute,
      cinema: movie.cinemaName,
      room: movie.movieHall,
      playTime: movie.playTime,
      price: movie.fares,
      isActivity: movie.isActivity === '1',
      movieCateList: movie.movieCateList,
      movieCinemaList: movie.movieCinemaList,
      movieActorList: movie.movieActorList,
      movieTime: movie.movieTime,
      otherDate,
      country: countryList,
      regionCategoryNameList,
      movieCinemaListMore: movieCinemaListMore,
    }
    return movieInfo
  })
}

async function completeProcess() {
  const allData = await getAllData()
  await pushOSS(allData)
  await doubanDataPutOSS({
    doubanInfoMap: allData.doubanInfoMap,
    doubanInfoMapAll: allData.doubanInfoMapAll,
    douToZlg: allData.douToZlg,
  })

  const calObject = createCalData(allData.movieList)
  const calAlert = createAlarm(allData.playDate.month)
  const calString = await createCalendar(calObject.concat(calAlert))
  putCal(calString)
  const csvStr = toCSV(allData.movieList)
  putCSV(csvStr)
  // TODO 新增数据发送邮件、生成rss.xml、浏览器通知
}
async function doubanInfoPatch() {
  const allData = await pullOSS()
  const { doubanInfoMapAll, doubanInfoMap, douToZlg } = await getDoubanData(
    allData.movieList,
    Date.now(),
  )
  await doubanDataPutOSS({
    doubanInfoMap,
    doubanInfoMapAll,
    douToZlg,
  })

  const calObject = createCalData(allData.movieList)
  const calAlert = createAlarm(['4'])
  const calString = await createCalendar(calObject.concat(calAlert))
  putCal(calString)
  const csvStr = toCSV(allData.movieList)
  putCSV(csvStr)
}
