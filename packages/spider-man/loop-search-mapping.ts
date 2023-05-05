import chalk from 'chalk'
import { getDouToZLG } from './server-douban'
import { pullDoubanInfoMap } from './server-oss'
import { IDoubanSearchItem, IZLGToDoubanMap, IServerMovieInfo } from './types'
import { getTime, sleep } from '@moviecal/utils'
import { doubanSpecial } from './douban-special'
import dayjs from 'dayjs'
import axios from 'axios'
import { queryMovieInfo } from './server-zlg'
import { readFileSync, writeFileSync } from 'node:fs'

const iaxios = axios.create({
  baseURL: `https://movie.douban.com`,
})

interface Douban {
  doubanId?: number
  douyear?: number
  commentCount?: number
  score?: number
  poster?: string
  movieId: number
  movieName: string
  movieMinute: number
  movieTime: string
}
type Info = IServerMovieInfo | null

export async function queryDoubanMovieInfo({
  name,
  year,
}: {
  name: string
  year: string
}) {
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
    console.log(`年份对不上: 豆瓣${target?.year} 原始数据${year}`)
    console.log(JSON.stringify(searchList))
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
    return {
      doubanId: target.id,
      score: Number(scoreExec?.[1]),
      commentCount: Number(commentCountExec?.[1]),
      poster: posterExec?.[1] ?? '',
      year: target.year,
    }
  } else {
    // console.error('未找到', name + ' ' + year)
    return null
  }
}

interface MovieInfoSimple {
  movieId: number
  name: string
  movieTime: string
}

export async function addToDoubanInfoMap({
  movieList,
  now,
  doubanInfoMap,
}: {
  movieList: MovieInfoSimple[]
  now: number
  doubanInfoMap: IZLGToDoubanMap
}): Promise<string[]> {
  const failed: string[] = []
  for (const movie of movieList) {
    const movieId = movie.movieId
    const movieName = movie.name
    if (doubanInfoMap[movieId]) continue

    if (doubanSpecial[movieId]) {
      doubanInfoMap[movieId] = doubanSpecial[movieId]
      continue
    }
    const info = await queryDoubanMovieInfo({
      name: movieName,
      year: dayjs(movie.movieTime).format('YYYY'),
    })
    if (info) {
      console.log('找到了', chalk.green(movieName))
      doubanInfoMap[movieId] = {
        updateTime: now,
        name: movieName,
        info: info,
      }
    } else {
      console.log('失败', movieName, movie.movieId)
      failed.push(movieName)
    }
    await sleep(getTime(1500, 3000))
  }
  return failed
}

export async function getDoubanData(movieList: MovieInfoSimple[], now: number) {
  const retryTimes = 1
  const doubanInfoMap = (await pullDoubanInfoMap()) ?? {}

  for (let timer = 0; timer < retryTimes; timer++) {
    const failed = await addToDoubanInfoMap({
      movieList,
      now,
      doubanInfoMap,
    })

    if (timer >= retryTimes) {
      console.log(
        chalk.red(`已尝试${retryTimes}次，仍有${failed.length}条未搜索到数据`),
      )
      console.log(failed.join(','))
      break
    } else if (failed.length > 0) {
      console.log(
        `第${timer + 1}次查找` +
          chalk.green(`已成功${movieList.length - failed.length}`) +
          chalk.red(`失败${failed.length}`),
      )
      console.log(failed.join(','))
    } else {
      console.log(chalk.green(`已全部找到`))
      break
    }
    await sleep(10000)
  }
  const douToZlg = await getDouToZLG(doubanInfoMap, now)
  return {
    douToZlg,
    doubanInfoMap,
  }
}

async function forEachSearch() {
  // let start = 1
  // const end = 1216
  // const list: { [id: number]: MovieInfoSimple } = {}
  // const listAll: { [id: number]: any } = {}
  // while (start <= end) {
  //   const resData = await queryMovieInfo(start)
  //   if (resData) {
  //     const info: MovieInfoSimple = {
  //       movieId: start,
  //       name: resData.movieName,
  //       movieTime: resData.movieTime,
  //     }
  //     console.log(start + ' ' + resData.movieName)
  //     list[start] = info
  //   }
  //   listAll[start] = resData
  //   sleep(getTime(100, 500))
  //   start++
  // }
  // writeFileSync(`${__dirname}/.cache/list-all.json`, JSON.stringify(listAll))
  // writeFileSync(`${__dirname}/.cache/list.json`, JSON.stringify(list))
  // console.log(JSON.stringify(list))
  // const infoList = []
  // for (const info of list) {
  //   const result = await queryDoubanMovieInfoUseSearchPage({
  //     name: info.name,
  //     year: info.movieTime,
  //   })
  //   infoList.push(result)
  // }
  // // const result = getDoubanData(list, Date.now())
  // console.log(infoList)

  const resStr = await readFileSync(`${__dirname}/.cache/list-all.json`, {
    encoding: 'utf-8',
    flag: 'r',
  })
  const mappingPath = `${__dirname}/.cache/mapping-movieid-douid.json`
  const mappingStr = await readFileSync(mappingPath, {
    encoding: 'utf-8',
    flag: 'r',
  })
  const mappingCache = JSON.parse(mappingStr) as IZLGToDoubanMap

  const resData = JSON.parse(resStr) as { [id: string]: Info }
  const classify = {
    交流: {},
    影评: {},
    其他: {},
  }
  const movielist: { [id: string]: Info } = {}
  for (const info of Object.values(resData)) {
    if (info) {
      // @ts-ignore
      if (info?.movieName?.includes('影评')) {
        // @ts-ignore
        classify['影评'][info?.movieName] = info
      } else if (
        // @ts-ignore
        info?.movieName?.includes('交流') ||
        // @ts-ignore
        info?.movieName?.includes('专访') ||
        // @ts-ignore
        info?.movieName?.includes('映前') ||
        // @ts-ignore
        info?.movieName?.includes('映后') ||
        // @ts-ignore
        info?.movieName?.includes('电影课') ||
        // @ts-ignore
        info?.movieName?.includes('特别放映') ||
        // @ts-ignore
        info?.movieName?.includes('见面会')
      ) {
        // @ts-ignore
        classify['交流'][info?.movieName] = info
        // @ts-ignore
      } else {
        // @ts-ignore
        classify['其他'][info?.movieName] = info
        movielist[info.movieId] = info
      }
    }
  }
  const resultList: Douban[] = []
  const time = Date.now()
  for (const id in movielist) {
    // if (Number(id) > 20) break
    const info = movielist[id]
    if (mappingCache[Number(id)]) continue
    if (info != null) {
      const infosimple = await queryDoubanMovieInfoUseSearchPage({
        movieName: info.movieName,
        movieTime: info.movieTime,
        movieId: info.movieId,
        movieMinute: info.movieMinute,
      })
      if (infosimple.doubanId) {
        mappingCache[Number(id)] = {
          name: info.movieName,
          updateTime: time,
          info: {
            doubanId: String(infosimple.doubanId),
            score: infosimple.score as number,
            commentCount: infosimple.commentCount as number,
            year: infosimple.movieTime,
            poster: infosimple.poster as string,
          },
        }
        console.log('search', infosimple.movieName)
      } else {
        console.log(
          infosimple.doubanId,
          infosimple.movieName,
          infosimple.movieTime,
        )
      }

      // console.log(infosimple)
      resultList.push(infosimple)
      await sleep(getTime(300, 1000))
    }
  }

  writeFileSync(mappingPath, JSON.stringify(mappingCache))
  // console.log(JSON.stringify(resultList))
  writeFileSync(`${__dirname}/.cache/res-list.json`, JSON.stringify(resultList))
}

const iaxios2 = axios.create({
  baseURL: `https://www.douban.com`,
})
export async function queryDoubanMovieInfoUseSearchPage(douban: Douban) {
  const name = douban.movieName
  const year = douban.movieTime
  const response = await iaxios2<string>({
    url: `/search`,
    params: { cat: '1002', q: `${name}+${year}` },
  }).catch((e) => {
    console.log('error', name, year)
    return { data: '' }
  })
  const moviePageHTML = response.data
  // sid: 35376457, qcat: '1002'})" >爱情神话 </a>
  // <span>(700000人评价)</span>
  // <span class="rating_nums">8.1</span>
  const result = /sid: (\d+), qcat: '1002'}\)" >(.*) <\/a>/.exec(moviePageHTML)
  const doubanId = result?.[1]
  const result2 = /<span class="subject-cast">.*(\d{4})<\/span>/.exec(
    moviePageHTML,
  )
  const douyear = result2?.[1]

  const result3 = /<span>\((\d+)人评价\)<\/span>/.exec(moviePageHTML)
  const commentCount = result3?.[1]

  const result4 = /<span class="rating_nums">([\d.]+)<\/span>/.exec(
    moviePageHTML,
  )
  const score = result4?.[1]

  // <img src="https://img2.doubanio.com/view/photo/s_ratio_poster/public/p2527824081.webp"></a>
  const result5 =
    /<img src="https:\/\/img\d.doubanio.com\/view\/photo\/s_ratio_poster\/public\/(.*)"><\/a>/.exec(
      moviePageHTML,
    )
  const poster = `https://img2.doubanio.com/view/photo/raw/public/${result5?.[1]}`

  const douInfo: Douban = {
    ...douban,
    poster: poster,
    doubanId: Number(doubanId),
    douyear: Number(douyear),
    commentCount: Number(commentCount),
    score: Number(score),
  }

  return douInfo
}

forEachSearch()
