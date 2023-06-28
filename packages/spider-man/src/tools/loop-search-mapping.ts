import chalk from 'chalk'
import { getDouToCFA } from '../server/douban'
// import { pullDoubanInfoMap } from '../server/oss'
import { ICFAToDoubanMap, IDoubanSearchItem, IServerMovieInfo } from '../types'
import { getTime, sleep } from '@moviecal/utils'
import { doubanSpecial } from '../data/douban-special'
import dayjs from 'dayjs'
import axios from 'axios'
import { readFileSync, writeFileSync } from 'node:fs'
import { queryMovieInfo } from '../server/cfa'
import path from 'node:path'

const iaxios = axios.create({
  baseURL: `https://movie.douban.com`,
})

const chacePath = path.resolve(__dirname, '../.cache')
const mappingPath = `${chacePath}/mapping-movieid-douid.json`
const movieIDOrderDataPath = `${chacePath}/movie-id-order-data.json`
const todoPickPath = `${chacePath}/todo-pick-list.json`
const videoTypePath = `${chacePath}/video.json`
const videoTypeList: number[] = []
let start = 1250
const end = 1380
const pickListUseCache = false

export interface CFAMapping {
  movieId: number
  movieName: string
  movieMinute: number
  movieTime: string
}
export interface DoubanMapping {
  doubanId: number
  douName: string
  douyear: number
  commentCount: number
  score: number
  poster: string
}
export interface MovieMapping extends CFAMapping, DoubanMapping {}
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
  doubanInfoMap: ICFAToDoubanMap
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
  const doubanInfoMap = {}

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
  const douToCFA = await getDouToCFA(doubanInfoMap, now)
  return {
    douToCFA,
    doubanInfoMap,
  }
}

async function cacheMovieList() {
  const movieIdOrderDataStr = await readFileSync(movieIDOrderDataPath, {
    encoding: 'utf-8',
    flag: 'r',
  })
  const listAll: { [id: number]: any } = JSON.parse(movieIdOrderDataStr)
  while (start <= end) {
    const resData = await queryMovieInfo(start)
    if (resData) {
      console.log(start + ' ' + resData.movieName)
    }
    listAll[start] = resData
    sleep(getTime(500, 1000))
    start++
  }
  writeFileSync(movieIDOrderDataPath, JSON.stringify(listAll))
}

async function forEachSearch() {
  const orderDataStr = await readFileSync(movieIDOrderDataPath, {
    encoding: 'utf-8',
    flag: 'r',
  })
  const mappingStr = await readFileSync(mappingPath, {
    encoding: 'utf-8',
    flag: 'r',
  })
  const videoTypeStr = await readFileSync(videoTypePath, {
    encoding: 'utf-8',
    flag: 'r',
  })
  const todoPickStr = await readFileSync(todoPickPath, {
    encoding: 'utf-8',
    flag: 'r',
  })
  const todoPick: MovieMapping[] = pickListUseCache
    ? JSON.parse(todoPickStr)
    : []
  const mappingCache = JSON.parse(mappingStr) as ICFAToDoubanMap
  const orderData = JSON.parse(orderDataStr) as { [id: string]: Info }
  const videoType = JSON.parse(videoTypeStr) as { [movieName: string]: Info }

  const movielist: { [id: string]: Info } = {}
  for (const info of Object.values(orderData)) {
    if (info == null) continue
    if (videoTypeList.includes(info.movieId)) {
      videoType[info.movieName] = info
    } else {
      movielist[info.movieId] = info
    }
  }

  const todoList = []
  const time = Date.now()
  for (let id = start; id <= end; id++) {
    const info = movielist[id]
    if (info == null) continue
    if (mappingCache[Number(id)]) continue
    if (info != null) {
      todoList.push({
        movieName: info.movieName,
        movieTime: info.movieTime,
        movieId: info.movieId,
        movieMinute: info.movieMinute,
      })
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
          douban: [
            {
              id: infosimple.doubanId,
              name: infosimple.douName,
              score: infosimple.score,
              commentCount: infosimple.commentCount,
              year: infosimple.douyear,
              poster: infosimple.poster,
            },
          ],
        }
        console.log('search', infosimple.movieName, infosimple.movieId)
      } else {
        console.log(
          infosimple.doubanId,
          infosimple.movieName,
          infosimple.movieTime,
        )
      }

      // console.log(infosimple)
      todoPick.push(infosimple)
      await sleep(getTime(1000, 1500))
    }
  }
  writeFileSync(todoPickPath, JSON.stringify(todoPick))
}

export async function queryDoubanMovieInfoUseSearchPage(cfa: CFAMapping) {
  const name = cfa.movieName
  const year = cfa.movieTime
  const response = await axios<string>({
    url: `https://www.douban.com/search`,
    params: { cat: '1002', q: `${name}+${year}` },
  }).catch((e) => {
    console.log('error', name, year)
    return { data: '' }
  })
  const html = response.data
  // sid: 35376457, qcat: '1002'})" >爱情神话 </a>
  // <span>(700000人评价)</span>
  // <span class="rating_nums">8.1</span>
  const doubanId = /sid: (\d+), qcat: '1002'}\)" >(.*) <\/a>/.exec(html)?.[1]
  const douyear = /class="subject-cast">.*(\d{4})/.exec(html)?.[1]
  const commentCount = /<span>\((\d+)人评价\)<\/span>/.exec(html)?.[1]
  const score = /<span class="rating_nums">([\d.]+)<\/span>/.exec(html)?.[1]
  const douName = /'1002'}\)" >(.*) <\/a>/.exec(html)?.[1]
  // <img src="https://img2.doubanio.com/view/photo/s_ratio_poster/public/p2527824081.webp"></a>
  const result5 =
    /<img src="https:\/\/img\d.doubanio.com\/view\/photo\/s_ratio_poster\/public\/(.*)"><\/a>/.exec(
      html,
    )?.[1]
  const poster = `https://img2.doubanio.com/view/photo/raw/public/${result5}`

  const douInfo: MovieMapping = {
    ...cfa,
    poster: poster,
    douName: douName ?? '',
    doubanId: Number(doubanId),
    douyear: Number(douyear),
    commentCount: Number(commentCount),
    score: Number(score),
  }

  return douInfo
}

// cacheMovieList()
forEachSearch()

/**
 * 1. 清空 videoTypeList，界定 start 和 end 的范围
 * 2. 运行 cacheMovieList 将新增的电影增量缓存到 movie-id-order-data.json
 * 3. 手动挑选出不需要处理的视频信息，放入 videoTypeList(可不用)
 * 4. 运行 forEachSearch 去豆瓣搜索电影，缓存到 todo-pick-list.json
 * 5. 修改index.html 100行界定对比范围
 * 6. 在浏览器中打开index检查并挑选，控制台获取到审核通过的列表ID，放回index.html和connect.ts
 * 7. 脚本未搜索到的电影使用 todo-pick-list 和 example/douban-spider.js 维护到douban-special.ts
 * 8. 运行 connect中的pick，如果打印[]说明完成了，再运行erverseMap()
 * 9. 将 videoTypeList 恢复到空
 * 10.再上传到oss就可以了
 *
 * https://github.com/wind8866/example/blob/main/scripts/douban-spider.js
 */
