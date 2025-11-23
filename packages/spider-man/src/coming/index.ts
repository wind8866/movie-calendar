import { EventAttributes } from 'ics'

import dayjs from '../tools/time-format'
import { fetchComingApi } from './api'

interface ComingMovieItem {
  id: string
  day: string
  title: string
  link: string
  tags: string
  region: string
  watch: number
  unit: 'day' | 'month'
}

export default class ComingMovie {
  async pull() {
    const comingPage = await fetchComingApi()
    return comingPage
  }
  async parse(html: string) {
    /**
      <table width="100%" class="coming_list">
        <tbody>
          <tr>
            <td>11月26日</td>
            <td>
              <a
                href="https://movie.douban.com/subject/26817136/"
                title="疯狂动物城2 Zootopia 2"
                >疯狂动物城2</a
              >
            </td>
            <td>喜剧 / 犯罪 / 动画</td>
            <td>美国</td>
            <td>227082人 想看</td>
          </tr>
        </tbody>
      </table>
     */
    const { load } = await import('cheerio')
    const $ = load(html)
    const trList = $('.coming_list tbody tr')
    const list: ComingMovieItem[] = []
    trList.each((_i, el) => {
      const tds = $(el).find('td')
      let day = $(tds[0]).text().replace(/\s/g, '')
      const title = $(tds[1]).text().trim()
      const link = $(tds[1]).find('a').attr('href') || ''
      const id = link.match(/subject\/(\d+)\//)?.[1] || ''
      const tags = $(tds[2]).text().trim().replace(/\s/g, '')
      const region = $(tds[3]).text().trim().replace(/\s/g, '')
      const watchText = $(tds[4]).text().trim()
      const watchMatch = watchText.match(/(\d+)人/)
      const watch = watchMatch ? Number(watchMatch[1]) : 0
      let unit: ComingMovieItem['unit'] = 'day'
      if (!day.includes('日')) {
        unit = 'month'
        day += '01日'
      }
      if (!day.includes('年')) {
        day = `${dayjs().year()}年` + day
      }
      list.push({ id, day, title, link, tags, region, watch, unit })
    })
    console.table(list)
    return list
  }
  async getCalAttributes(list: ComingMovieItem[]) {
    const cals: EventAttributes[] = []
    list.forEach((item) => {
      const { day, title, link, unit } = item
      const start = dayjs
        .tz(day.replace(/[年月日]/g, '/'))
        .utc()
        .format('YYYY MM DD')
        .split(' ')
        .map((str) => Number(str)) as [number, number, number, number, number]

      cals.push({
        title: unit === 'month' ? `${title} (本月)` : `${title}`,
        start: start,
        end: start,
        url: link,
        description: `想看人数: ${item.watch}\n类型: ${item.tags}\n地区: ${item.region}`,
      })
    })
    return cals
  }
  getCalTitle() {
    const timeNow = dayjs()
      .hour(9)
      .minute(0)
      .format('YYYY MM DD HH mm')
      .split(' ')
      .map((str) => Number(str)) as [number, number, number, number, number]
    const titleInfo: EventAttributes = {
      title: '即将上映-豆瓣电影',
      calName: '即将上映-豆瓣电影',
      start: timeNow,
      duration: { hours: 0, minutes: 30 },
      description: `不定期更新`,
      categories: ['豆瓣'],
      url: 'https://movie.douban.com/coming',
    }
    return titleInfo
  }
  pushToOss(list: ComingMovieItem[]) {
    // TODO: put to oss
  }
  pushCalToDB(list: EventAttributes[]) {
    // TODO: put cal to db
  }
}
