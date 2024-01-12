import { same } from './connect'
import { doubanSpecial } from '../data/douban-special'
import { queryMovieInfo, queryMovieLibrryInfo } from '../server/cfa'

const videoList: number[] = []
const errorList: { [k: number]: string } = {}
const end = 1560
const start = 1
for (let i = start; i <= end; i++) {
  if (doubanSpecial[i]) continue
  if (same.includes(i)) continue
  videoList.push(i)
}
console.log(videoList)
let count = 0
const dic: {
  id: number
  电影名: string
  日期: string
}[] = []
async function pull() {
  for (const id of videoList) {
    if (count > 30) break
    const res = await queryMovieLibrryInfo(id)
    if (res) {
      dic.push({
        id: res.movieId,
        电影名: res.movieName,
        日期: res.movieTime,
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

// /api/movie/movieLibrryInfo/1417
interface M {
  movieId: number
  movieName: string
  intro: string // 简介
  movieCateList: {
    categoryId: number
    categoryName: string
    categoryNameEn?: string
    type?: unknown
  }
  realName: string // 貌似是导演或演员
  movieTime: string // 2023-04-23 00:00:00
  languageCategoryNameList: {
    categoryId: number
    categoryName: string // 中文/英语
    categoryNameEn: string // Chinese
    type: number
  }[]
}

// /api/movie/movieActorList/1417
interface People {
  position: string // 演员/导演
  photo: string
  realName: string // 杨鸽、巴斯·德沃斯
  portrayName: string // 主持人
  imaginedId?: unknown
}

// /api/movie/movieTrailerList/1417
interface VideoInfo {
  prevue: string // https://cdn.cfa.org.cn/2023/07/517ae8f8-2226-47bf-8c4c-a160999b83a6.mp4
  duration: string // 17:45
  title: string // 《小世界》映后交流
}
