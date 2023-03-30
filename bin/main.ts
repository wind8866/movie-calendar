import https from 'node:https'
import fsPromise from 'node:fs/promises'
import fs from 'node:fs'
import ics, { EventAttributes } from 'ics'
import dayjs from 'dayjs'
import dotent from 'dotenv'
import { IServerMovieItemInfo, IMovieInfo, IServerMovieInfo } from './types'
import { insertDoubanInfo } from './getDoubanInfo'
import 'colors/safe'
import papa from 'papaparse'

// [min, max]
export function getTime(min: number, max: number) {
  return min + Math.round(Math.random() * (max - min))
}

// staus n time
export function sleep(time: number = 1000) {
  return new Promise((resolve) => {
    setTimeout(resolve, time)
  })
}
function toCSV(movieList: IMovieInfo[]): string {
  const printList = movieList.map((m, index) => {
    let url = ''
    let score: number | string = 0
    let commentCount: number | string = 0
    if (m.doubanId) {
      url = `https://movie.douban.com/subject/${m.doubanId}/`
      score = m.score ?? 0
      commentCount = m.commentCount ?? 0
    } else if (m.doubanList) {
      url = m.doubanList
        ?.map((d) => `https://movie.douban.com/subject/${d.doubanId}/`)
        .join(' ')
      score = m.doubanList?.map((d) => d.score).join(' ')
      commentCount = m.doubanList?.map((d) => d.commentCount).join(' ')
    }
    const director = m.movieActorList
      .filter((v) => v.position === '导演')
      .map((v) => v.realName)
      .join(' ')
    return [
      m.name,
      // dayjs(m.saleTime).format('MM月DD日 HH:mm'),
      dayjs(m.playTime).format(`MM月DD日`),
      '周' + '日一二三四五六'[dayjs(m.playTime).day()],
      dayjs(m.playTime).format('HH:mm'),
      // m.minute,
      m.cinema + m.room,
      m.price,
      m.isActivity ? '有' : '',
      // m.movieCinemaListMore?.length,
      dayjs(m.movieTime).format('YYYY'),
      m.country,
      // m.movieCateList.map((cate) => cate.categoryName).join(','),
      director,
      score,
      commentCount,
      url,
      index === 0 ? `update: ${dayjs().format('MMDD HH:mm:ss')}` : '',
    ]
  })
  return papa.unparse({
    fields: [
      '电影名',
      // '售票时间',
      '放映日期',
      '周几',
      '放映时间',
      // '时长',
      '影厅',
      '票价',
      '活动',
      // '多场放映',
      '年份',
      '国家|地区',
      // '类型',
      '导演',
      '豆瓣评分',
      '评论人数',
      '豆瓣链接',
      '备注',
    ],
    data: printList,
  })
}

dotent.config()
export const config = {
  categories: ['资料馆'],
  year: '2023',
  month: '04',
  days: 31,
  useLocal: true,
  cache: true,
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

function createCalendar(calData: EventAttributes[]): string {
  const { error, value } = ics.createEvents(calData)
  return value ?? ''
}
function createAlarm(): EventAttributes[] {
  const title = `🎬${config.categories[0]}${Number(config.month)}月观影日历`
  const monthInfo: EventAttributes = {
    title: title,
    calName: title,
    start: [Number(config.year), Number(config.month), 1, 9, 0],
    duration: { hours: 0, minutes: 30 },
    alarms: [
      {
        action: 'display',
        description: 'Reminder',
        trigger: { hours: 0, minutes: 1, before: true },
      },
    ],
    description: `\
其他月份日历：https://movie.wind8866.top
修改意见(New issue)：https://github.com/wind8866/movie-calendar/issues
数据更新日期：${dayjs(Date.now()).format('MM/DD HH:mm:ss')}

${config.month}月豆列(精红)
${config.douList[config.year + config.month]?.join('\n')}
`,
    categories: config.categories,
    url: 'https://movie.wind8866.top',
  }
  const alarmList: EventAttributes[] = [monthInfo]
  config.saleTime.forEach((date) => {
    const time = dayjs(date)
    alarmList.push({
      start: [
        time.get('year'),
        time.get('month') + 1,
        time.get('date'),
        time.get('hours'),
        time.get('minutes'),
      ],
      duration: { hours: 0, minutes: 30 },
      title: `⏰记得买电影票啊 ${time.format('HH:mm:ss')}`,
      alarms: [
        {
          action: 'display',
          description: 'Reminder',
          trigger: { hours: 0, minutes: 11, before: true },
        },
      ],
      description: ``,
      categories: config.categories,
    })
  })
  return alarmList
}
function createCalData(movieList: IMovieInfo[]): EventAttributes[] {
  return movieList.map((m) => {
    let doubanInfo = ''
    if (m.doubanId) {
      doubanInfo = `
评分${m.score}  \
人数${m.commentCount?.toLocaleString()}`
    } else if (m.doubanList) {
      doubanInfo = m.doubanList.reduce((per, current) => {
        return `${per}
豆瓣评分${current.score}  \
评论人数${current.commentCount?.toLocaleString() ?? 0} \
https://movie.douban.com/subject/${m.doubanId}/`
      }, '')
    }
    const country = (m.country ?? []).join('/')
    let otherDate = m.otherDate
      ?.filter((date) => date !== m.playTime)
      .map((date) => dayjs(date).format('D'))
      .join(',')
    const description = `\
${dayjs(m.movieTime).format('YYYY')}年 \
${m.minute}分钟 \
${country} \
${doubanInfo}

${m.price}元 \
${m.cinema}${m.room}
${m.isActivity ? '有放映活动  ' : ''}\
${otherDate ? `本月${otherDate}日也有放映` : ''}`
    const title = `\
${m.isActivity ? '🎉 ' : ''}\
${m.name}\
${
  config.roomTitleShort[m.cinema + m.room]
    ? ' ' + config.roomTitleShort[m.cinema + m.room]
    : ''
}
`
    return {
      start: dayjs(m.playTime)
        .format('YYYY MM DD HH mm')
        .split(' ')
        .map((str) => Number(str)),
      duration: {
        hours: Math.floor(m.minute / 60),
        minutes: m.minute % 60,
      },
      title,
      description,
      categories: config.categories,
      url: m.doubanId
        ? `https://movie.douban.com/subject/${m.doubanId}/`
        : undefined,
    } as EventAttributes
  })
}

async function wFile(string: string, path: string) {
  return fsPromise.writeFile(path, string)
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

function queryMovieList(dayList: string[]) {
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

function getDayList(year: string, month: string): string[] {
  return new Array(config.days).fill('').map((_, index) => {
    const monthFormat = month.padStart(2, '0')
    const dayFormat = String(index + 1).padStart(2, '0')
    return `${year}-${monthFormat}-${dayFormat}`
  })
}
