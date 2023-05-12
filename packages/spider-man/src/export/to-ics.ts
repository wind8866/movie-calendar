import { IAllData, IMovieInfo } from '../types'
import dayjs from 'dayjs'
import { config } from '../config'
import { EventAttributes, createEvents } from 'ics'

import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.tz.setDefault('Asia/Shanghai')

export function createCalData(movieList: IMovieInfo[]): EventAttributes[] {
  return movieList.map((m) => {
    let douURL: undefined | string = undefined
    const doubanInfo = m.doubanInfo?.info
    let doubanInfoText = ''
    if (Array.isArray(doubanInfo)) {
      doubanInfoText = doubanInfo.reduce((per, current) => {
        return `${per}
豆瓣评分${current.score}  \
评论人数${current.commentCount?.toLocaleString() ?? 0} \
https://movie.douban.com/subject/${current.doubanId}/`
      }, '')
    } else if (doubanInfo) {
      douURL = `https://movie.douban.com/subject/${doubanInfo.doubanId}/`
      doubanInfoText = `
评分${doubanInfo.score}  \
人数${doubanInfo.commentCount?.toLocaleString()}`
    }

    const country = (m.country ?? []).join('/')
    const otherDate = m.otherDate
      ?.filter((date) => date !== m.playTime)
      .map((date) => dayjs.tz(date).format('D'))
      .join(',')
    const description = `\
${dayjs.tz(m.movieTime).format('YYYY')}年 \
${m.minute}分钟 \
${country} \
${doubanInfoText}

${m.price}元 \
${m.cinema}${m.room}
${m.isActivity ? '有放映活动  ' : ''}\
${otherDate ? `本月${otherDate}日也有放映` : ''}`
    const title = `\
${m.isActivity ? '🎉 ' : ''}\
${m.name}\
${
  config.roomTitleShort[m.cinema + m.room]
    ? ' ' + config.roomTitleShort[m.cinema + m.room]
    : ''
}
`
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

export function createAlarm([
  current,
  next,
]: IAllData['playDate']['month']): EventAttributes[] {
  const yesterday = dayjs.tz(Date.now()).subtract(1, 'day')
  const title = `资料馆电影日历`
  const titleInfo: EventAttributes = {
    title: title,
    calName: title,
    start: [yesterday.year(), yesterday.month() + 1, yesterday.date(), 7, 0],
    duration: { hours: 0, minutes: 30 },
    description: `\
首页🏠：https://movie.wind8866.top
修改意见📩：https://github.com/wind8866/movie-calendar/issues
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
    alarmList.push({
      start: [
        time.get('year'),
        time.get('month') + 1,
        time.get('date'),
        time.get('hours'),
        time.get('minutes'),
      ],
      duration: { hours: 0, minutes: 30 },
      title: `⏰记得买电影票啊 ${time.format('HH:mm:ss')}`,
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
