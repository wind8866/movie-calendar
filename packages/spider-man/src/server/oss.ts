import dotent from 'dotenv'
import { IAllData, IMovieInfo, ICFAToDoubanMap } from '../types'
import dayjs from 'dayjs'
import { getSaleTimeSet } from '../main'
import { getDouToCFA } from '../server/douban'
import { ossServer } from '@moviecal/utils/oss'
import { appMessagePushEmail } from '../export/message-push'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { LocalType } from '../export/to-ics'

dotent.config()
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.tz.setDefault('Asia/Shanghai')

const currentPath = 'current/'
const movieListName = 'movie-list.json' // 最新的排片
const addedNewMovieListName = 'movie-list-added.json' // 新增的排片
const doubanInfoMapName = 'cfa-to-dou-dic-map.json' // movieId: douId
const douIdToMovieIdName = 'dou-to-cfa-dic-map.json' // douId: movieId
const calName = 'current.ics' // 日历数据

const archivedPath = 'archived/'
const date = dayjs.tz(Date.now()).format('YYYY-MM-DD-HH')
const csvName = `csv-${date}.csv`
const allDataName = `alldata-${date}.json`
const addedNewMovieListBackupName = `movie-list-added-${date}.json` // 新增的排片

async function catchError(title: string, error: Error, throwUp = true) {
  await appMessagePushEmail({
    type: 'error',
    msg: title,
    json: JSON.stringify(
      JSON.stringify({
        message: error?.message,
        stack: error?.stack,
      }),
    ),
  })
  if (throwUp) throw error
}

// 获取缓存的 movieId: douId
export function pullDoubanInfoMap() {
  return ossServer
    .pull<ICFAToDoubanMap>({
      servePath: currentPath,
      serveName: doubanInfoMapName,
    })
    .catch((e) => {
      console.error(e)
      return null
    })
}

// 缓存新增的排片
export async function putAddedNewMovieList(movieList: IMovieInfo[]) {
  const encoder = new TextEncoder()

  await ossServer
    .put({
      servePath: currentPath,
      serveName: addedNewMovieListName,
      local: new Buffer(encoder.encode(JSON.stringify(movieList))),
    })
    .catch(async (error) => {
      catchError('oss added movieList upload error', error)
    })
  await ossServer
    .put({
      servePath: archivedPath,
      serveName: addedNewMovieListBackupName,
      local: new Buffer(encoder.encode(JSON.stringify(movieList))),
    })
    .catch(async (error) => {
      catchError('oss added movieList of archived upload error', error)
    })
}
// 缓存所有数据
export async function putAllData(allData: IAllData) {
  const encoder = new TextEncoder()

  await ossServer
    .put({
      servePath: archivedPath,
      serveName: allDataName,
      local: new Buffer(encoder.encode(JSON.stringify(allData))),
      headers: {
        'x-oss-object-acl': 'private',
        'x-oss-storage-class': 'IA',
      },
    })
    .catch(async (error) => {
      catchError('oss allData upload error', error)
    })
}

// 缓存 movieList
export async function putMovieList(movieList: IMovieInfo[]) {
  const encoder = new TextEncoder()

  // movie list
  await ossServer
    .put({
      servePath: currentPath,
      serveName: movieListName,
      local: new Buffer(encoder.encode(JSON.stringify(movieList))),
    })
    .catch(async (error) => {
      catchError('!!! oss movieList upload error', error)
    })
}
// 获取上次缓存的 movieList
export function pullMovieList(): Promise<IMovieInfo[]> {
  return ossServer
    .pull<IMovieInfo[]>({
      servePath: currentPath,
      serveName: movieListName,
    })
    .catch((e) => {
      console.error(e)
      return []
    })
}

// 缓存 douId <=> movieId
export async function doubanDataPutOSS({
  cfaToDou,
  douToCFA,
}: {
  cfaToDou: ICFAToDoubanMap
  douToCFA: Awaited<ReturnType<typeof getDouToCFA>>
}) {
  const encoder = new TextEncoder()
  // movieId to douId
  await ossServer
    .put({
      servePath: currentPath,
      serveName: doubanInfoMapName,
      local: new Buffer(encoder.encode(JSON.stringify(cfaToDou))),
    })
    .catch(async (error) => {
      catchError('oss cfaToDou upload error', error)
    })

  // douId to movieId
  await ossServer
    .put({
      servePath: currentPath,
      serveName: douIdToMovieIdName,
      local: new Buffer(encoder.encode(JSON.stringify(douToCFA))),
    })
    .catch(async (error) => {
      catchError('oss douToCFA upload error', error)
    })
}

// 存储生成的日历
export async function putCal(str: string, localType: LocalType = 'all') {
  const encoder = new TextEncoder()
  let serveName = 'current.ics'
  if (localType === 'xiaoxitian') {
    serveName = 'current-xiaoxitian.ics'
  } else if (localType === 'baiziwan') {
    serveName = 'current-baiziwan.ics'
  }
  await ossServer
    .put({
      servePath: currentPath,
      serveName,
      local: Buffer.from(encoder.encode(str)),
    })
    .catch(async (error) => {
      catchError('!!!oss Calendar upload error', error)
    })
}
// 存储 excel
export async function putCSV(str: string) {
  const encoder = new TextEncoder()
  await ossServer
    .put({
      servePath: archivedPath,
      serveName: csvName,
      local: Buffer.from(encoder.encode(str)),
    })
    .catch(async (error) => {
      catchError('oss CVS upload error', error)
    })
}

// 同时获取movieList和豆瓣数据
export async function pullOSS() {
  // movie list
  const movieList: IMovieInfo[] = await ossServer.pull({
    servePath: currentPath,
    serveName: movieListName,
  })

  // movieId to douId
  const doubanInfoMap: ICFAToDoubanMap = await ossServer.pull({
    servePath: currentPath,
    serveName: doubanInfoMapName,
  })

  // douId to movieId
  const douToCFA: Awaited<ReturnType<typeof getDouToCFA>> =
    await ossServer.pull({
      servePath: currentPath,
      serveName: douIdToMovieIdName,
    })
  const saleTimeList = getSaleTimeSet(movieList)

  return {
    movieList,
    douToCFA,
    doubanInfoMap,
    saleTimeList,
  }
}
