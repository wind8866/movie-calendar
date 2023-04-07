import dotent from 'dotenv'
import {
  IMovieInfo,
  IServerMovieInfo,
  IServerMovieItem,
  IAllData,
} from './types'
import { createAlarm, createCalData, createCalendar } from './to-ics'
import { queryDoubanInfoMap, getDouToZLG } from './get-douban-info'
import 'colors/safe'
import toCSV from './to-csv'
import { wFile } from '@/utils'
import { fetchPlayTimeList, queryMovieInfoMap, queryMovieList } from './server'
import { put } from './oss'
import zlgToDouban from './douban-special'
import { config } from './config'

dotent.config()

export async function getAllData(): Promise<IAllData> {
  const now = Date.now()
  const { dayList, month } = await fetchPlayTimeList()
  const movieListRaw = await queryMovieList(dayList, now)
  const movieInfoMapRaw = await queryMovieInfoMap(movieListRaw.list, now)

  // TODO: zlgToDouban[movieId] 从OSS取
  const doubanInfoMap = await queryDoubanInfoMap({
    movieList: movieListRaw.list,
    now,
    zlgToDoubanCache: zlgToDouban,
  })
  const douToZlg = await getDouToZLG(doubanInfoMap, now)

  const movieList: IMovieInfo[] = combineData({
    movieListRaw,
    movieInfoMapRaw,
    doubanInfoMap,
  })
  const saleTimeList = new Set<string>()
  movieList.forEach((movie) => {
    movie.movieCinemaListMore?.forEach((data) => {
      saleTimeList.add(data.movieActiveDto.saleTime)
    })
  })

  return {
    now,
    month,
    dayList,
    movieList,
    movieListRaw,
    movieInfoMapRaw,
    doubanInfoMap,
    douToZlg,
    saleTimeList,
  }
}

export async function pushOSS(allData: IAllData) {}
// export async function pullOSS(): IAllData {
//   // TODO
// }
interface CombineDataProps {
  movieListRaw: Awaited<ReturnType<typeof queryMovieList>>
  movieInfoMapRaw: Awaited<ReturnType<typeof queryMovieInfoMap>>
  doubanInfoMap: Awaited<ReturnType<typeof queryDoubanInfoMap>>
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
  const calObject = createCalData(allData.movieList)
  const calAlert = createAlarm(allData.month)
  const calString = await createCalendar(calObject.concat(calAlert))
}
main()
