import dayjs from 'dayjs'
import axios from 'axios'
import chalk from 'chalk'
import {
  IDoubanInfo,
  IDoubanSearchItem,
  IMovieInfo,
  IServerMovieItem,
  IZLGToDoubanMap,
} from './types'
import { getTime, sleep } from '@moviecal/utils'
import { pullDoubanInfoMap } from './server-oss'
import { doubanSpecial } from './douban-special'

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
  // const response = await iaxios<IDoubanSearchItem[]>({
  //   url: `/j/subject_suggest`,
  //   params: { q: name },
  // })
  // const searchList = response.data
  // let target = searchList?.filter((item) => item.year === year)[0]
  // if (!target && searchList.length > 0) {
  //   target = searchList?.filter(
  //     (item) => Number(item.year) - Number(year) <= 2,
  //   )[0]
  //   console.log(`年份对不上: 豆瓣${target?.year} 原始数据${year}`)
  //   console.log(JSON.stringify(searchList))
  // }
  const fakeData = {
    雄狮少年: { id: '35144311', year: '2021' },
    摩托日记: { id: '1309015', year: '2004' },
    菊次郎的夏天: { id: '1293359', year: '1999' },
    '当我们仰望天空时看见什么？': { id: '35360566', year: '2021' },
    海街日记: { id: '25895901', year: '2015' },
    神女: { id: '1302210', year: '1934' },
    晨光正好: { id: '35211730', year: '2022' },
    一次别离: { id: '5964718', year: '2011' },
    比邻星: { id: '27133567', year: '2019' },
    '坂本龙一：异步': { id: '30128122', year: '2018' },
    '坂本龙一：终曲': { id: '26984189', year: '2017' },
    兔子暴力: { id: '30289828', year: '2020' },
    '82年生的金智英': { id: '30327842', year: '2019' },
    安东尼娅家族: { id: '1296482', year: '1995' },
    鸟类变形记: { id: '34952486', year: '2020' },
    春潮: { id: '27186348', year: '2019' },
    '妈妈！': { id: '34954093', year: '2022' },
    小蝌蚪找妈妈: { id: '3335371', year: '1960' },
    儿孙福: { id: '3211002', year: '1926' },
    '艾尔米塔什博物馆：艺术的力量': { id: '35028651', year: '2019' },
    俄罗斯方舟: { id: '1302279', year: '2002' },
    情书: { id: '1292220', year: '1995' },
    爱情神话: { id: '35376457', year: '2021' },
    绿洲: { id: '1299582', year: '2002' },
    柏林苍穹下: { id: '1292504', year: '1987' },
    士兵之歌: { id: '1295614', year: '1959' },
    我是古巴: { id: '1432669', year: '1964' },
    '0.5毫米': { id: '21767183', year: '2014' },
    月升中天: { id: '3592496', year: '1955' },
    母亲: { id: '2995198', year: '1949' },
    白日焰火: { id: '21941804', year: '2014' },
    潜行者: { id: '1295656', year: '1979' },
    育蝇奇谭: { id: '33459135', year: '2020' },
    薄荷糖: { id: '1303145', year: '1999' },
    平原上的夏洛克: { id: '33400376', year: '2019' },
    被嫌弃的松子的一生: { id: '1787291', year: '2006' },
    逃走的女人: { id: '34958725', year: '2020' },
    阿基里斯与龟: { id: '3039187', year: '2008' },
    通讯员: { id: '2361887', year: '1986' },
    雷曼兄弟三部曲: { id: '33459931', year: '2019' },
    定理: { id: '1297130', year: '1968' },
    祝福: { id: '1465450', year: '1956' },
    人约巴黎: { id: '1294486', year: '1995' },
    滑板少年: { id: '27611421', year: '2018' },
    明天和每一天: { id: '26649254', year: '2017' },
    '惠子，凝视': { id: '35727254', year: '2022' },
    特写: { id: '1303521', year: '1990' },
    牛奶配送员的奇幻人生: { id: '24706550', year: '2016' },
    黑猫白猫: { id: '1293236', year: '1998' },
    地下: { id: '1292206', year: '1995' },
    秦香莲: { id: '4720779', year: '1964' },
    母与子: { id: '1844191', year: '1947' },
    折翼母亲: { id: '1293233', year: '1994' },
    又见奈良: { id: '30437716', year: '2020' },
    横道世之介: { id: '10484041', year: '2013' },
    家族之苦: { id: '26020796', year: '2016' },
    家族之苦2: { id: '26848504', year: '2017' },
    家族之苦3: { id: '27108740', year: '2018' },
    浮云世事: { id: '1304749', year: '1996' },
    没有过去的男人: { id: '1307790', year: '2002' },
    薄暮之光: { id: '1472907', year: '2006' },
    朝阳沟: { id: '2347433', year: '1963' },
    横风之中: { id: '25957004', year: '2014' },
    慈母曲: { id: '2123435', year: '1937' },
    母性之光: { id: '1844188', year: '1933' },
    抱紧我: { id: '33406477', year: '2021' },
    暴裂无声: { id: '26647117', year: '2017' },
    弗兰兹: { id: '26616719', year: '2016' },
    探戈课: { id: '1306960', year: '1997' },
    在街上: { id: '34809360', year: '2019' },
    暴雪将至: { id: '26775933', year: '2017' },
    奇遇: { id: '1389923', year: '1960' },
    红色沙漠: { id: '1299261', year: '1964' },
    杨门女将: { id: '1498719', year: '1960' },
    奶牛: { id: '34945456', year: '2021' },
    革命家庭: { id: '1437313', year: '1961' },
    小妈妈: { id: '35225859', year: '2021' },
    路边野餐: { id: '26337866', year: '2015' },
    面包店的女孩: { id: '1394348', year: '1963' },
    苏姗娜的故事: { id: '1293030', year: '1963' },
    女收藏家: { id: '1297344', year: '1967' },
    慕德家一夜: { id: '1296283', year: '1969' },
    克莱尔的膝盖: { id: '1294915', year: '1970' },
    午后之爱: { id: '1293963', year: '1972' },
    宝莲灯: { id: '1299643', year: '1999' },
    随心所欲: { id: '1296757', year: '1962' },
    苦菜花: { id: '1493588', year: '1965' },
  }
  // @ts-ignore
  const target = fakeData[name]
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

export async function addToDoubanInfoMap({
  movieList,
  now,
  doubanInfoMap,
}: {
  movieList: IMovieInfo[]
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

export async function getDoubanData(movieList: IMovieInfo[], now: number) {
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
