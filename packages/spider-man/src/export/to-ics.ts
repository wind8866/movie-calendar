import { IAllData, IMovieInfo } from '../types'
import dayjs from 'dayjs'
import { config } from '../config'
import { EventAttributes, createEvents } from 'ics'

import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.tz.setDefault('Asia/Shanghai')

export type LocalType = 'all' | 'xiaoxitian' | 'baiziwan'

export function createCalData(
  movieList: IMovieInfo[],
  localType: LocalType = 'all',
): EventAttributes[] {
  return movieList.map((m) => {
    let douURL: undefined | string = undefined
    const doubanInfo = m.doubanInfo?.douban
    let doubanInfoText = ''
    if (doubanInfo != null) {
      if (doubanInfo.length === 1) {
        douURL = `https://movie.douban.com/subject/${doubanInfo[0].id}/`
      }
      doubanInfoText = doubanInfo
        .map((current) => {
          const url =
            doubanInfo.length > 1
              ? `https://movie.douban.com/subject/${current.id}/`
              : ''
          return `
评分${current.score}  \
人数${current.commentCount?.toLocaleString() ?? 0} \
${url}`
        })
        .join('')
    }
    const director = m.movieActorList
      .filter((v) => v.position === '导演')
      .map((v) => v.realName)
      .join('|')
    const country = (m.country ?? []).join('/')
    const otherDate = m.otherDate
      ?.filter((date) => date !== m.playTime)
      .map((date) => dayjs.tz(date).format('D'))
      .join(',')
    const description = `\
${dayjs.tz(m.movieTime).format('YYYY')}年 \
${m.minute}分钟 \
${country}
导演: ${director}
${doubanInfoText}

${m.price}元 \
${m.cinema}${m.room}
${m.isActivity ? '有放映活动  ' : ''}\
${otherDate ? `本月${otherDate}日也有放映` : ''}`
    let title = `${m.isActivity ? '🎉 ' : ''}${m.name}`
    if (localType !== 'baiziwan') {
      title += config.roomTitleShort[m.cinema + m.room]
        ? ' ' + config.roomTitleShort[m.cinema + m.room]
        : ''
    }
    const start = dayjs
      .tz(m.playTime)
      .utc()
      .format('YYYY MM DD HH mm')
      .split(' ')
      .map((str) => Number(str)) as [number, number, number, number, number]
    return {
      start,
      startInputType: 'utc',
      duration: {
        hours: Math.floor(m.minute / 60),
        minutes: m.minute % 60,
      },
      title,
      description,
      categories: ['资料馆'],
      url: douURL,
    }
  })
}

interface AlarmParams {
  title?: string
}
export function createAlarm(params?: AlarmParams): EventAttributes[] {
  const yesterday = dayjs.tz(Date.now()).subtract(1, 'day')
  const title = params?.title ?? `资料馆电影日历`
  const titleInfo: EventAttributes = {
    title: title,
    calName: title,
    start: [yesterday.year(), yesterday.month() + 1, yesterday.date(), 7, 0],
    duration: { hours: 0, minutes: 30 },
    description: `\
帮助文档💡：https://www.yuque.com/qifengle-z7w1e/vu76du/fpnoal2o9z5aqrhu?singleDoc
意见反馈📩：电影群里@北风
更新日期🕙：${dayjs.tz(Date.now()).format('MM/DD HH:mm:ss')}
`,
    categories: ['资料馆'],
    url: 'https://movie.wind8866.top',
  }
  const alarmList: EventAttributes[] = [titleInfo]
  config.saleTime.forEach((date) => {
    const time = dayjs.tz(date)
    // hidden 24h ago
    if (Number(dayjs.tz(Date.now())) - Number(time) > 86400000) return
    const start = time
      .utc()
      .format('YYYY MM DD HH mm')
      .split(' ')
      .map((str) => Number(str)) as [number, number, number, number, number]
    // TODO: 临时这么做，因为可能出现连续的提醒问题，后序改成在当前时间之后才提醒
    if (start[3] !== 12) return
    alarmList.push({
      start: start,
      startInputType: 'utc',
      duration: { hours: 0, minutes: 30 },
      title: `⏰记得买电影票啊 ${time.format('HH:mm')}`,
      alarms: [
        {
          action: 'display',
          description: 'Reminder',
          trigger: { hours: 0, minutes: 16, before: true },
        },
      ],
      description: ``,
      categories: ['资料馆'],
    })
  })
  return alarmList
}

export function createCalendar(calData: EventAttributes[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const { error, value } = createEvents(calData)
    if (error) {
      reject(error)
    }
    resolve(value as string)
  })
}
