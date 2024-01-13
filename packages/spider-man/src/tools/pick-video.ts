import { same } from './connect'
import { doubanSpecial } from '../data/douban-special'
import {
  hostname,
  queryMovieActorList,
  queryMovieInfo,
  queryMovieLibrryInfo,
  queryMovieTrailerList,
} from '../server/cfa'
import dayjs from 'dayjs'

const videoList: number[] = []
const errorList: { [k: number]: string } = {}
const end = 1560
const start = 400
for (let i = start; i <= end; i++) {
  if (doubanSpecial[i]) continue
  if (same.includes(i)) continue
  videoList.push(i)
}
console.log(videoList)
let count = 0
const dic: {
  id: number
  映后标题: string
  '关联影人/影片': string
  简介: string
  活动方式: string
  日期: string
  语言: string
  映后人员: string
  时长: string
  视频地址: string
  网页地址: string
  备注: string
}[] = []
async function pull() {
  for (const id of videoList) {
    if (count > 40) break
    const res = await queryMovieLibrryInfo(id)
    if (res) {
      const actorList = await queryMovieActorList(id)
      const actorText = actorList
        .map((item) => {
          let role = item.position
          if (item.portrayName) role = item.portrayName
          return `${item.realName}(${role})`
        })
        .join(',')
      const guess = /《(.*)》/.exec(res.movieName)?.[1] ?? ''
      const videoInfo = await queryMovieTrailerList(id)
      dic.push({
        id: res.movieId,
        映后标题: res.movieName,
        '关联影人/影片': guess,
        简介: 'res.intro',
        活动方式: res.movieCateList.map((item) => item.categoryName).join(','),
        日期: dayjs(res.movieTime).format('YYYY-MM-DD'),
        语言: res.languageCategoryNameList
          .map((item) => item.categoryName)
          .join(','),
        映后人员: actorText,
        时长: videoInfo.map((item) => item.duration).join(','),
        视频地址: videoInfo.map((item) => item.prevue).join(','),
        网页地址: `${hostname}/h5/share.html?id=${id}&type=1`,
        备注: '',
      })
    } else {
      const res = await queryMovieInfo(id)
      errorList[id] = JSON.stringify(res)
      console.log('失败', id, res)
    }
    count++
  }
  console.table(dic)
  console.table(errorList)
}
pull()

// /h5/share.html?id=1417&type=1
