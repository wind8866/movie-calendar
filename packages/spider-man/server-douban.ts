import dayjs from 'dayjs'
import colors from 'colors/safe'
import axios from 'axios'
import {
  IDoubanInfo,
  IDoubanSearchItem,
  IMovieInfo,
  IServerMovieItem,
  IZLGToDoubanMap,
} from './types'
import { getTime, sleep } from '@moviecal/utils'
import { pullDoubanInfoMap } from './server-oss'

const iaxios = axios.create({
  baseURL: `https://movie.douban.com`,
})

export async function queryDoubanMovieInfo({
  name,
  year,
}: {
  name: string
  year: string
}) {
  return new Promise<IDoubanInfo | null>(async (resolve, reject) => {
    const response = await iaxios<IDoubanSearchItem[]>({
      url: `/j/subject_suggest`,
      params: { q: name },
    })
    const searchList = response.data
    let target = searchList?.filter((item) => item.year === year)[0]
    if (!target && searchList.length > 0) {
      target = searchList?.filter(
        (item) => Number(item.year) - Number(year) <= 2,
      )[0]
      console.log(`年份对不上: 豆瓣${target.year} 原始数据${year}`)
      console.log(searchList)
    }
    if (target) {
      const response = await iaxios<string>({
        url: `/subject/${target.id}/`,
      })
      const moviePageHTML = response.data
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
  for (const movieId in doubanMap) {
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

export async function getDoubanInfoMap({
  movieList,
  now,
  doubanInfoMap = {},
  timer = 0,
  retryTimes = 3,
  zlgToDoubanCache,
}: {
  movieList: IMovieInfo[]
  now: number
  zlgToDoubanCache: IZLGToDoubanMap
  doubanInfoMap?: IZLGToDoubanMap
  retryTimes?: number
  timer?: number
}): Promise<IZLGToDoubanMap> {
  let failed: string[] = []
  for (const movie of movieList) {
    const movieId = movie.movieId
    const movieName = movie.name
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
      failed.push(movieName)
    }
    await sleep(getTime(500, 1500))
  }

  if (timer >= retryTimes) {
    console.log(
      colors.red(`已尝试${retryTimes}次，仍有${failed.length}条未搜索到数据`),
    )
    console.log(failed.join(','))
    return doubanInfoMap
  } else if (failed.length > 0) {
    console.log(
      colors.green(
        `第${timer + 1}次查找，已成功${movieList.length - failed.length}，失败${
          failed.length
        }`,
      ),
    )
    getDoubanInfoMap({
      movieList,
      now,
      doubanInfoMap,
      timer: timer + 1,
      zlgToDoubanCache,
    })
  }
  console.log(colors.green(`已全部找到`))
  return doubanInfoMap
}

export async function getDoubanData(movieList: IMovieInfo[], now: number) {
  const oldDoubanInfoMap = await pullDoubanInfoMap()
  const doubanInfoMap = await getDoubanInfoMap({
    movieList,
    now,
    zlgToDoubanCache: oldDoubanInfoMap ?? {},
  })
  const douToZlg = await getDouToZLG(doubanInfoMap, now)
  const doubanInfoMapAll = { ...oldDoubanInfoMap, ...doubanInfoMap }

  return {
    douToZlg,
    doubanInfoMap,
    doubanInfoMapAll,
  }
}
