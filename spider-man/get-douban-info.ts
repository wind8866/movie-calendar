import dayjs from 'dayjs'
import https from 'node:https'
import URL from 'node:url'
import colors from 'colors/safe'
import {
  IDoubanInfo,
  IDoubanSearchItem,
  IServerMovieItem,
  IZLGToDoubanMap,
} from './types'
import { getTime, sleep } from '@/utils'

function getRequest<T>(options: { url: string; parse?: boolean }) {
  const { url, parse = true } = options
  const urlObject = URL.parse('https://' + url)

  return new Promise<T>((resolve, reject) => {
    const options = {
      hostname: urlObject.hostname,
      port: 443,
      path: urlObject.path,
      headers: {
        Host: urlObject.hostname!,
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        // Referer: 'https://movie.douban.com',
        // TODO: why add content-type error
        // 'Content-Type': 'application/json; charset=utf-8',
        // 'Transfer-Encoding': 'chunked',
        // Cookie: config.doubanCookie,
        // TODO: Cookie
      },
    }
    https
      .get(options, (res) => {
        const data: Buffer[] = []
        res.on('data', (chunk) => {
          data.push(chunk)
        })
        res.on('end', () => {
          const resString = Buffer.concat(data).toString()
          const res = parse ? JSON.parse(resString) : resString
          resolve(res)
        })
      })
      .on('error', (err) => {
        console.error(err)
      })
  })
}
export async function queryDoubanMovieInfo({
  name,
  year,
}: {
  name: string
  year: string
}) {
  return new Promise<IDoubanInfo | null>(async (resolve, reject) => {
    const searchList = await getRequest<IDoubanSearchItem[]>({
      url: `movie.douban.com/j/subject_suggest?q=${encodeURI(name)}`,
    })
    let target = searchList?.filter((item) => item.year === year)[0]
    if (!target && searchList.length > 0) {
      target = searchList?.filter(
        (item) => Number(item.year) - Number(year) <= 2,
      )[0]
      console.log(`年份对不上: 豆瓣${target.year} 原始数据${year}`)
      console.log(searchList)
    }
    if (target) {
      const moviePageHTML = await getRequest<string>({
        url: `movie.douban.com/subject/${target.id}/`,
        parse: false,
      })
      const scoreExec = /v:average">([\d.]*)<\/strong>/.exec(moviePageHTML)
      const commentCountExec =
        /<span property="v:votes">(\d+)<\/span>人评价/.exec(moviePageHTML)
      const posterExec = /<img src="(.*)" title="点击看更多海报"/.exec(
        moviePageHTML,
      )
      resolve({
        doubanId: target.id,
        score: Number(scoreExec?.[1]),
        commentCount: Number(commentCountExec?.[1]),
        poster: posterExec?.[1] ?? '',
        year: target.year,
      })
    } else {
      // console.error('未找到', name + ' ' + year)
      resolve(null)
    }
  })
}

export async function getDouToZLG(doubanMap: IZLGToDoubanMap, now: number) {
  const douToZlg: { updateTime: number; [k: number]: number } = {
    updateTime: now,
  }
  for (const movieId in Object.entries(doubanMap)) {
    const { info } = doubanMap[movieId]
    if (Array.isArray(info)) {
      info.forEach((item) => {
        douToZlg[Number(item.doubanId)] = Number(movieId)
      })
    } else {
      douToZlg[Number(info.doubanId)] = Number(movieId)
    }
  }
  return douToZlg
}

export async function queryDoubanInfoMap({
  movieList,
  now,
  doubanInfoMap = {},
  timer = 0,
  retryTimes = 3,
  zlgToDoubanCache,
}: {
  movieList: IServerMovieItem[]
  now: number
  zlgToDoubanCache: IZLGToDoubanMap
  doubanInfoMap?: IZLGToDoubanMap
  retryTimes?: number
  timer?: number
}): Promise<IZLGToDoubanMap> {
  let failedCount = 0
  for (const movie of movieList) {
    const movieId = movie.movieId
    const movieName = movie.movieName
    if (doubanInfoMap[movieId]) continue
    if (zlgToDoubanCache[movieId]) {
      doubanInfoMap[movieId] = {
        updateTime: now,
        name: movieName,
        info: zlgToDoubanCache[movieId]?.info,
      }
      continue
    }

    const info = await queryDoubanMovieInfo({
      name: movieName,
      year: dayjs(movie.movieTime).format('YYYY'),
    })
    if (info) {
      doubanInfoMap[movieId] = {
        updateTime: now,
        name: movieName,
        info: info,
      }
    } else {
      failedCount++
    }
    await sleep(getTime(500, 1500))
  }

  if (timer >= retryTimes) {
    console.log(
      colors.red(`已尝试${retryTimes}次，仍有${failedCount}条未搜索到数据`),
    )
    return doubanInfoMap
  } else if (failedCount > 0) {
    console.log(
      colors.green(
        `第${timer + 1}次查找，已成功${
          movieList.length - failedCount
        }，失败${failedCount}`,
      ),
    )
    queryDoubanInfoMap({
      movieList,
      now,
      doubanInfoMap,
      timer: timer + 1,
      zlgToDoubanCache,
    })
  }
  return doubanInfoMap
}
