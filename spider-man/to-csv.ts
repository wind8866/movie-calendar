import dayjs from 'dayjs'
import { IMovieInfo } from './types'
import Papa from 'papaparse'

export default function toCSV(movieList: IMovieInfo[]): string {
  const printList = movieList.map((m, index) => {
    let url = ''
    let score: number | string = 0
    let commentCount: number | string = 0
    if (m.doubanId) {
      url = `https://movie.douban.com/subject/${m.doubanId}/`
      score = m.score ?? 0
      commentCount = m.commentCount ?? 0
    } else if (m.doubanList) {
      url = m.doubanList
        ?.map((d) => `https://movie.douban.com/subject/${d.doubanId}/`)
        .join(' ')
      score = m.doubanList?.map((d) => d.score).join(' ')
      commentCount = m.doubanList?.map((d) => d.commentCount).join(' ')
    }
    const director = m.movieActorList
      .filter((v) => v.position === '导演')
      .map((v) => v.realName)
      .join(' ')
    return [
      m.name,
      // dayjs(m.saleTime).format('MM月DD日 HH:mm'),
      dayjs(m.playTime).format(`MM月DD日`),
      '周' + '日一二三四五六'[dayjs(m.playTime).day()],
      dayjs(m.playTime).format('HH:mm'),
      // m.minute,
      m.cinema + m.room,
      m.price,
      m.isActivity ? '有' : '',
      // m.movieCinemaListMore?.length,
      dayjs(m.movieTime).format('YYYY'),
      m.country,
      // m.movieCateList.map((cate) => cate.categoryName).join(','),
      director,
      score,
      commentCount,
      url,
      index === 0 ? `update: ${dayjs().format('MMDD HH:mm:ss')}` : '',
    ]
  })
  return Papa.unparse({
    fields: [
      '电影名',
      // '售票时间',
      '放映日期',
      '周几',
      '放映时间',
      // '时长',
      '影厅',
      '票价',
      '活动',
      // '多场放映',
      '年份',
      '国家|地区',
      // '类型',
      '导演',
      '豆瓣评分',
      '评论人数',
      '豆瓣链接',
      '备注',
    ],
    data: printList,
  })
}
