import dotent from 'dotenv'
import { IAllData, IMovieInfo, IZLGToDoubanMap } from './types'
import dayjs from 'dayjs'
import { getSaleTimeSet } from './main'
import { getDouToZLG } from './server-douban'
import { ossServer } from '@moviecal/utils/oss'

dotent.config()

const currentPath = 'current/'
const movieListName = 'movie-list.json' // 最新的排片
const addedNewMovieListName = 'movie-list-added.json' // 新增的排片
const doubanInfoMapName = 'mapping-movieid-douid.json' // movieId: douId
const douIdToMovieIdName = 'mapping-douid-movieid.json' // douId: movieId
const calName = 'current.ics' // 日历数据

const archivedPath = 'archived/'
const date = dayjs().format('YYYY-MM-DD-HH')
const csvName = `csv-${date}.csv`
const allDataName = `alldata-${date}.json`
const addedNewMovieListBackupName = `movie-list-added-${date}.json` // 新增的排片

// 获取缓存的 movieId: douId
export function pullDoubanInfoMap() {
  return ossServer
    .pull<IZLGToDoubanMap>({
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

  await ossServer.put({
    servePath: currentPath,
    serveName: addedNewMovieListName,
    local: new Buffer(encoder.encode(JSON.stringify(movieList))),
  })
  await ossServer.put({
    servePath: archivedPath,
    serveName: addedNewMovieListBackupName,
    local: new Buffer(encoder.encode(JSON.stringify(movieList))),
  })
}
// 缓存所有数据
export async function putAllData(allData: IAllData) {
  const encoder = new TextEncoder()

  await ossServer.put({
    servePath: archivedPath,
    serveName: allDataName,
    local: new Buffer(encoder.encode(JSON.stringify(allData))),
    headers: {
      'x-oss-object-acl': 'private',
      'x-oss-storage-class': 'IA',
    },
  })
}

// 缓存 movieList
export async function putMovieList(movieList: IMovieInfo[]) {
  const encoder = new TextEncoder()

  // movie list
  await ossServer.put({
    servePath: currentPath,
    serveName: movieListName,
    local: new Buffer(encoder.encode(JSON.stringify(movieList))),
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
  doubanInfoMap,
  douToZlg,
}: {
  doubanInfoMap: IZLGToDoubanMap
  douToZlg: Awaited<ReturnType<typeof getDouToZLG>>
}) {
  const encoder = new TextEncoder()
  // movieId to douId
  await ossServer.put({
    servePath: currentPath,
    serveName: doubanInfoMapName,
    local: new Buffer(encoder.encode(JSON.stringify(doubanInfoMap))),
  })

  // douId to movieId
  await ossServer.put({
    servePath: currentPath,
    serveName: douIdToMovieIdName,
    local: new Buffer(encoder.encode(JSON.stringify(douToZlg))),
  })
}

// 存储生成的日历
export async function putCal(str: string) {
  const encoder = new TextEncoder()
  await ossServer.put({
    servePath: currentPath,
    serveName: calName,
    local: Buffer.from(encoder.encode(str)),
  })
}
// 存储 excel
export async function putCSV(str: string) {
  const encoder = new TextEncoder()
  await ossServer.put({
    servePath: archivedPath,
    serveName: csvName,
    local: Buffer.from(encoder.encode(str)),
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
  const doubanInfoMap: IZLGToDoubanMap = await ossServer.pull({
    servePath: currentPath,
    serveName: doubanInfoMapName,
  })

  // douId to movieId
  const douToZlg: Awaited<ReturnType<typeof getDouToZLG>> =
    await ossServer.pull({
      servePath: currentPath,
      serveName: douIdToMovieIdName,
    })
  const saleTimeList = getSaleTimeSet(movieList)

  return {
    movieList,
    douToZlg,
    doubanInfoMap,
    saleTimeList,
  }
}
