import dayjs from 'dayjs'
import https from 'node:https'
import URL from 'node:url'
import colors from 'colors/safe'
import { IDoubanInfo, IDoubanSearchItem, IMovieInfo } from './types'
import { sleep, getTime, config } from './main'

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
        Cookie: config.doubanCookie,
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
        poster: posterExec?.[1],
      })
    } else {
      console.error('未找到', name + ' ' + year)
      resolve(null)
    }
  })
}

const special: {
  [k: string]: IDoubanInfo | IDoubanInfo[]
} = {
  '面包店的女孩+苏姗娜的故事': [
    {
      doubanId: '1394348',
      score: 8.2,
      commentCount: 22755,
      poster:
        'https://img1.doubanio.com/view/photo/s_ratio_poster/public/p2559172988.jpg',
    },
    {
      doubanId: '1293030',
      score: 7.2,
      commentCount: 11749,
      poster:
        'https://img2.doubanio.com/view/photo/s_ratio_poster/public/p2202641383.jpg',
    },
  ],
}

export async function insertDoubanInfo(
  movieList: IMovieInfo[],
  timer: number = 0,
): Promise<IMovieInfo[]> {
  let failedCount = 0
  for (const index in movieList) {
    const movie = movieList[index]
    if (movie.doubanId || movie.doubanList) {
      console.log(`跳过${movie.doubanId}`)
      continue
    }
    const specialItem = special[movie.name]
    if (specialItem) {
      if (specialItem instanceof Array) {
        movie.doubanList = specialItem
      } else {
        movie.doubanId = specialItem.doubanId
        movie.score = specialItem.score
        movie.commentCount = specialItem.commentCount
        movie.poster = specialItem.poster
      }
      continue
    }
    const info = await queryDoubanMovieInfo({
      name: movie.name,
      year: dayjs(movie.movieTime).format('YYYY'),
    })
    if (info) {
      movieList[index] = {
        ...movie,
        ...info,
      }
    } else {
      failedCount++
    }
    await sleep(getTime(500, 1500))
  }

  if (timer > 2) {
    console.log(colors.red(`已尝试3次，仍有${failedCount}条未搜索到数据`))
    return movieList
  } else if (failedCount > 0) {
    console.log(
      colors.green(
        `第${timer + 1}次查找，已成功${
          movieList.length - failedCount
        }，失败${failedCount}`,
      ),
    )
    insertDoubanInfo(movieList, timer + 1)
  }
  return movieList
}
