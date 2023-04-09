import dotent from 'dotenv'
import 'colors/safe'

import { IMovieInfo, IAllData } from './types'
import { getDoubanInfoMap, getDouToZLG } from './server-douban'
import { queryPlayDayList, getMovieInfoMap, getMovieList } from './server-zlg'
import { pullDoubanInfoMap, pullMovieList, pushOSS } from './server-oss'
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

export async function getAllData(): Promise<IAllData> {
  const now = Date.now()
  const playDate = await queryPlayDayList()
  const movieListRaw = await getMovieList(playDate.dayList, now)
  const movieInfoMapRaw = await getMovieInfoMap(movieListRaw.list, now)

  const oldDoubanInfoMap = await pullDoubanInfoMap()
  const doubanInfoMap = await getDoubanInfoMap({
    movieList: movieListRaw.list,
    now,
    zlgToDoubanCache: oldDoubanInfoMap ?? {},
  })
  const douToZlg = await getDouToZLG(doubanInfoMap, now)
  const doubanInfoMapAll = { ...oldDoubanInfoMap, ...doubanInfoMap }

  const movieList: IMovieInfo[] = combineData({
    movieListRaw,
    movieInfoMapRaw,
    doubanInfoMap,
  })
  const addedMovie = await diffMovieList(movieList)
  const saleTimeList = new Set<string>()
  movieList.forEach((movie) => {
    movie.movieCinemaListMore?.forEach((data) => {
      saleTimeList.add(data.movieActiveDto.saleTime)
    })
  })

  return {
    now,
    playDate,
    doubanInfoMapAll,
    movieList,
    movieListRaw,
    movieInfoMapRaw,
    doubanInfoMap,
    douToZlg,
    saleTimeList,
    addedMovie,
  }
}

interface CombineDataProps {
  movieListRaw: Awaited<ReturnType<typeof getMovieList>>
  movieInfoMapRaw: Awaited<ReturnType<typeof getMovieInfoMap>>
  doubanInfoMap: Awaited<ReturnType<typeof getDoubanInfoMap>>
}
function combineData({
  movieListRaw,
  movieInfoMapRaw,
  doubanInfoMap,
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
      doubanInfo: doubanInfoMap[movieId],
      otherDate,
      country: countryList,
      regionCategoryNameList,
      movieCinemaListMore: movieCinemaListMore,
    }
    return movieInfo
  })
}

async function main() {
  const allData = await getAllData()
  await pushOSS(allData)
  // const calObject = createCalData(allData.movieList)
  // const calAlert = createAlarm(allData.month)
  // const calString = await createCalendar(calObject.concat(calAlert))
}
main()
