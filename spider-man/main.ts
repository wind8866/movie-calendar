import fsPromise from 'node:fs/promises'
import fs from 'node:fs'
import dotent from 'dotenv'
import { IServerMovieItemInfo, IMovieInfo, IServerMovieInfo } from './types'
import { insertDoubanInfo } from './get-douban-info'
import 'colors/safe'
import toCSV from './to-csv'
import { getDayList, wFile } from '@/utils'
import { createAlarm, createCalData, createCalendar } from './to-ics'
import { EventAttributes } from 'ics'
import { queryMovieList } from './server'

dotent.config()
export const config = {
  categories: ['资料馆'],
  year: '2023',
  month: '04',
  days: 31,
  useLocal: true,
  cache: false,
  printLog: true,
  doubanCookie: ``,
  localPath: `${process.cwd()}/data/zlg`,
  saleTime: new Set<string>(),
  douList: {
    base: [
      '23年全年：https://www.douban.com/doulist/153324641/',
      '1号厅满场：https://www.douban.com/doulist/151048869/',
    ],
    '202304': [
      '小西天1号厅：https://www.douban.com/doulist/154478483/',
      '小西天2号厅+百子湾：https://www.douban.com/doulist/154478797/',
    ],
  } as {
    base: string[]
    [key: string]: string[]
  },
  roomTitleShort: {
    小西天艺术影院1号厅: '',
    小西天艺术影院2号厅: '2号厅',
    百子湾艺术影院1号厅: '百子湾',
  } as { [k: string]: string },
  printSeatInfo(
    movie: IServerMovieItemInfo,
    info: IServerMovieInfo['movieCinemaList'][number],
  ): void {},
}

export async function main() {
  const dayList = getDayList(config.year, config.month)
  const localFilePath = `${config.localPath}/${config.year}${config.month}.json`
  let movieListFormat: IMovieInfo[] = []

  // 获取原始数据
  if (fs.existsSync(localFilePath) && config.useLocal) {
    movieListFormat = JSON.parse(
      (await fsPromise.readFile(localFilePath)).toString(),
    )
    movieListFormat = await insertDoubanInfo(movieListFormat)
    if (config.cache) {
      await wFile(JSON.stringify(movieListFormat), localFilePath)
    }
  } else {
    const movieList = await queryMovieList(dayList)
    if (config.cache) {
      await wFile(
        JSON.stringify(movieList),
        `${config.localPath}/${config.year}${config.month}.cache.json`,
      )
    }
    movieListFormat = infoFormat(movieList)
    movieListFormat = await insertDoubanInfo(movieListFormat)
    if (config.cache) {
      await wFile(JSON.stringify(movieListFormat), localFilePath)
    }
  }

  // 处理数据
  movieListFormat.forEach((movie) => {
    movie.movieCinemaListMore?.forEach((data) => {
      config.saleTime.add(data.movieActiveDto.saleTime)
    })
  })
  const calData: EventAttributes[] = createCalData(movieListFormat)
  calData.unshift(...createAlarm())
  const calendarStr = createCalendar(calData)
  await wFile(
    calendarStr,
    `${process.cwd()}/dist/ics/zlg-${config.year}${config.month}.ics`,
  )

  const csvStr: string = toCSV(movieListFormat)
  await wFile(
    csvStr,
    `${process.cwd()}/dist/csv/zlg-${config.year}${config.month}.csv`,
  )

  console.log('Successful! 🎉')
}

function infoFormat(movieList: IServerMovieItemInfo[]): IMovieInfo[] {
  return movieList.map((movie) => {
    const otherDate: string[] = []
    movie.otherInfo?.movieCinemaList.forEach((info) => {
      otherDate.push(info.playTime)
      config?.printSeatInfo(movie, info)
    })
    const countryList = movie.otherInfo?.regionCategoryNameList.map(
      (info) => info.categoryName,
    )

    return {
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
      doubanId: movie.doubanId,
      score: movie.score,
      commentCount: movie.commentCount,
      regionCategoryNameList: movie.otherInfo?.regionCategoryNameList.map(
        (data) => ({ categoryName: data.categoryName }),
      ),
      movieCinemaListMore: movie.otherInfo?.movieCinemaList.map((data) => ({
        saleTime: data.saleTime,
        playTime: data.playTime,
        movieActiveDto: data.movieActiveDto,
      })),
    }
  })
}
