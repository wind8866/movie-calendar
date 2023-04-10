import OSS from 'ali-oss'
import dotent from 'dotenv'
import qs from 'querystring'
import { IAllData, IDoubanInfo, IMovieInfo, IZLGToDoubanMap } from './types'
import dayjs from 'dayjs'
import { getSaleTimeSet } from './main'
import { getDouToZLG } from './server-douban'

dotent.config()

const client = new OSS({
  region: process.env.OSS_REGION,
  accessKeyId: process.env.OSS_KEY_ID as string,
  accessKeySecret: process.env.OSS_KEY_SECRET as string,
  bucket: process.env.OSS_BUCKET,
  secure: true,
})

/**
 * 参考文档
 *  公共头：https://help.aliyun.com/document_detail/31955.htm
 *  存储类型区别：https://help.aliyun.com/document_detail/51374.htm
 *  putObject: https://help.aliyun.com/document_detail/31978.html
 * 备注
 *  设置公共头Date但OSS不会存储这个值
 */
interface PutParams {
  servePath: string
  serveName: string
  local: string | ArrayBuffer
  headers?: {
    'x-oss-storage-class'?: 'Standard' | 'IA' | 'Archive' | 'ColdArchive'
    'x-oss-object-acl'?:
      | 'default'
      | 'public-read'
      | 'private'
      | 'public-read-write'
    'x-oss-forbid-overwrite'?: 'false' | 'true'
    'x-oss-tagging'?: { [k: string]: string } | string
    'x-oss-meta-timestamp'?: number
  }
}
async function put({ servePath, serveName, local, headers = {} }: PutParams) {
  const defaultHeaders = {
    'x-oss-storage-class': 'Standard', // 标准存储
    'x-oss-object-acl': 'public-read', // 公共读
    'Content-Disposition': `inline; filename="${encodeURIComponent(
      serveName,
    )}"`,
    'x-oss-forbid-overwrite': 'false', // 允许覆盖
  }
  if (typeof headers['x-oss-tagging'] === 'object') {
    headers['x-oss-tagging'] = qs.stringify(headers['x-oss-tagging'])
  }

  const result = await client.put(servePath + serveName, local, {
    headers: {
      ...defaultHeaders,
      ...headers,
    },
  })
  return result
}

interface PullParams {
  servePath: string
  serveName: string
  type?: 'json' | 'text' | 'buff'
}
async function pull<T>({
  servePath,
  serveName,
  type = 'json',
}: PullParams): Promise<T> {
  const result = await client.get(servePath + serveName)
  if (type === 'json') {
    return JSON.parse(result.content.toString())
  } else if (type === 'text') {
    return result.content.toString()
  } else if (type === 'buff') {
    return result.content
  }
  return result.content
}
// 判断是否存在
// https://help.aliyun.com/document_detail/111392.html?spm=a2c4g.32074.0.0.36c2786c1TyRCb
// 修改元数据
// https://help.aliyun.com/document_detail/111412.html?spm=a2c4g.111392.0.0.996710cbNUg94A
// 拷贝文件：用不着拷贝，在写入文件时写入一个备份文件，写入失败报警
export const ossServer = {
  put,
  pull,
}

const dataPath = 'latest-data/'
const movieListName = 'movie-list.json'
const doubanInfoMapName = 'douban-info-map.json'
const doubanInfoMapAllName = 'douban-info-map-all.json'
const doubanListName = 'douban-list.json'
const douIdToMovieIdName = 'douTo-zlg-mapping.json'

const exportPath = 'latest-export/'
const calName = 'zlg-cal.ics'
const csvName = 'zlg-csv.csv'

const backupPath = `backup/${dayjs().format('YYYY-MM-DD-HH')}/`

export function pullDoubanInfoMap() {
  return ossServer
    .pull<IZLGToDoubanMap>({
      servePath: dataPath,
      serveName: doubanInfoMapName,
    })
    .catch((e) => {
      console.error(e)
      return null
    })
}

export function pullMovieList(): Promise<IMovieInfo[]> {
  return ossServer
    .pull<IMovieInfo[]>({
      servePath: dataPath,
      serveName: doubanListName,
    })
    .catch((e) => {
      console.error(e)
      return []
    })
}

export async function doubanDataPutOSS({
  doubanInfoMap,
  doubanInfoMapAll,
  douToZlg,
}: {
  doubanInfoMap: IZLGToDoubanMap
  doubanInfoMapAll: IZLGToDoubanMap
  douToZlg: Awaited<ReturnType<typeof getDouToZLG>>
}) {
  const encoder = new TextEncoder()
  // movieId to douId
  await ossServer.put({
    servePath: dataPath,
    serveName: doubanInfoMapName,
    local: new Buffer(encoder.encode(JSON.stringify(doubanInfoMap))),
  })

  // movieId to douId All
  await ossServer.put({
    servePath: dataPath,
    serveName: doubanInfoMapAllName,
    local: new Buffer(encoder.encode(JSON.stringify(doubanInfoMapAll))),
  })

  // douId to movieId
  await ossServer.put({
    servePath: dataPath,
    serveName: douIdToMovieIdName,
    local: new Buffer(encoder.encode(JSON.stringify(douToZlg))),
  })
}

export async function pushOSS(allData: IAllData) {
  const encoder = new TextEncoder()

  // movie list
  await ossServer.put({
    servePath: dataPath,
    serveName: movieListName,
    local: new Buffer(encoder.encode(JSON.stringify(allData.movieList))),
  })
}

export async function putCal(str: string) {
  const encoder = new TextEncoder()
  await ossServer.put({
    servePath: exportPath,
    serveName: calName,
    local: Buffer.from(encoder.encode(str)),
  })
}
export async function putCSV(str: string) {
  const encoder = new TextEncoder()
  await ossServer.put({
    servePath: exportPath,
    serveName: csvName,
    local: Buffer.from(encoder.encode(str)),
  })
}

export async function pullOSS() {
  // movie list
  const movieList: IMovieInfo[] = await ossServer.pull({
    servePath: dataPath,
    serveName: movieListName,
  })

  // movieId to douId
  const doubanInfoMap: IZLGToDoubanMap = await ossServer.pull({
    servePath: dataPath,
    serveName: doubanInfoMapName,
  })

  // movieId to douId All
  const doubanInfoMapAll: IZLGToDoubanMap = await ossServer.pull({
    servePath: dataPath,
    serveName: doubanInfoMapAllName,
  })

  // douId to movieId
  const douToZlg: Awaited<ReturnType<typeof getDouToZLG>> =
    await ossServer.pull({
      servePath: dataPath,
      serveName: douIdToMovieIdName,
    })
  const saleTimeList = getSaleTimeSet(movieList)

  return {
    movieList,
    douToZlg,
    doubanInfoMap,
    doubanInfoMapAll,
    saleTimeList,
  }
}
