import chalk from 'chalk'
import dayjs from 'dayjs'
import { IMovieInfo } from '../types'
import { getAllData } from '../main'

export function logSoldState(movieList: IMovieInfo[]) {
  const viewScale = 40
  const sale80Up = movieList
    .map((m) => {
      let scale = 0
      let total = 0
      m.movieCinemaListMore?.forEach((info) => {
        if (info.playTime === m.playTime) {
          if (info.seatTotal == null || info.seatSold == null) return
          total = info.seatTotal
          scale =
            Math.round(
              ((info.seatTotal - info.seatSold) / info.seatTotal) * 10000,
            ) / 100
        }
      })
      return {
        电影名: m.name,
        年份: Number(dayjs.tz(m.movieTime).format('YYYY')),
        导演: m.movieActorList
          .filter((m) => m.position === '导演')
          // https://zhuanlan.zhihu.com/p/33335629
          .map((m) => /(\p{Unified_Ideograph}|·| |-)+/gu.exec(m.realName)?.[0])
          .join('|'),
        豆瓣评分: m.doubanInfo?.douban.map((dou) => dou.score).join('/'),
        评论人数: m.doubanInfo?.douban.map((dou) => dou.commentCount).join('/'),
        '国家/地区': m.regionCategoryNameList
          ?.map((c) => c.categoryName)
          .join('/'),
        上座率: scale,
        座位数: total,
        映后活动: m.isActivity ? '有' : '',
      }
    })
    .filter((m) => m.上座率 >= viewScale)
  console.log(
    chalk.bold.green(
      `${dayjs.tz(new Date()).format('DD日')}12:00开售，截至${dayjs
        .tz(new Date())
        .format('DD日HH时mm分')} 销量超${viewScale}%的有:`,
    ),
  )
  // console.log('红辣椒 https://movie.douban.com/subject/1865703/ \n千年女优 https://movie.douban.com/subject/1307394 ')
  console.table(sale80Up.sort((a, b) => b.上座率 - a.上座率))

  console.log('\n')
  const soldOutList = movieList
    .filter((m) => m.soldOut)
    .map((m) => ({
      电影名: m.name,
      放映时间: m.playTime,
      影厅: m.cinema + m.room,
      活动: m.isActivity ? '有' : '',
    }))
  console.log(
    chalk.bold.green(
      `截至${dayjs.tz(new Date()).format('DD日HH时mm分')}，共有${
        soldOutList.length
      }场售罄`,
    ),
  )
  console.table(soldOutList)
  console.log('\n')
}

async function completeProcess() {
  const allData = await getAllData()
  logSoldState(allData.movieList)
}
completeProcess()
