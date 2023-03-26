import https from 'node:https'
import URL from 'node:url'
import { IDoubanInfo, IDoubanSearchItem } from './types'

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

        Accept: '*/*',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        // Connection: 'keep-alive',
        // Host: 'movie.douban.com',
        Origin: 'https://search.douban.com',
        Referer:
          'https://search.douban.com/movie/subject_search?search_text=%E6%85%95%E5%BE%B7%E5%AE%B6%E4%B8%80%E5%A4%9C&cat=1002',
        'sec-ch-ua':
          '"Google Chrome";v="111", "Not(A:Brand";v="8", "Chromium";v="111"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-site',
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36',
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
    const target = searchList.filter((item) => item.year === year)[0]
    if (target) {
      const moviePageHTML = await getRequest<string>({
        url: `movie.douban.com/subject/${target.id}/`,
        parse: false,
      })
      console.error('成功一次✅', name + ' ' + year)
      const scoreExec = /v:average">([\d.]*)<\/strong>/.exec(moviePageHTML)
      const commentCountExec =
        /<span property="v:votes">(\d+)<\/span>人评价/.exec(moviePageHTML)
      resolve({
        doubanId: target.id,
        score: Number(scoreExec?.[1]),
        commentCount: Number(commentCountExec?.[1]),
      })
    } else {
      console.log(searchList, encodeURI(name))
      console.error('豆瓣未找到', name + ' ' + year)
      resolve(null)
    }
  })
}
