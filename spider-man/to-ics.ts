import { IMovieInfo } from './types'
import dayjs from 'dayjs'
import { config } from './main'
import ics, { EventAttributes } from 'ics'

export function createCalData(movieList: IMovieInfo[]): EventAttributes[] {
  return movieList.map((m) => {
    let doubanInfo = ''
    if (m.doubanId) {
      doubanInfo = `
评分${m.score}  \
人数${m.commentCount?.toLocaleString()}`
    } else if (m.doubanList) {
      doubanInfo = m.doubanList.reduce((per, current) => {
        return `${per}
豆瓣评分${current.score}  \
评论人数${current.commentCount?.toLocaleString() ?? 0} \
https://movie.douban.com/subject/${m.doubanId}/`
      }, '')
    }
    const country = (m.country ?? []).join('/')
    let otherDate = m.otherDate
      ?.filter((date) => date !== m.playTime)
      .map((date) => dayjs(date).format('D'))
      .join(',')
    const description = `\
${dayjs(m.movieTime).format('YYYY')}年 \
${m.minute}分钟 \
${country} \
${doubanInfo}

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
    return {
      start: dayjs(m.playTime)
        .format('YYYY MM DD HH mm')
        .split(' ')
        .map((str) => Number(str)),
      duration: {
        hours: Math.floor(m.minute / 60),
        minutes: m.minute % 60,
      },
      title,
      description,
      categories: config.categories,
      url: m.doubanId
        ? `https://movie.douban.com/subject/${m.doubanId}/`
        : undefined,
    } as EventAttributes
  })
}

export function createAlarm(): EventAttributes[] {
  const title = `🎬${config.categories[0]}${Number(config.month)}月观影日历`
  const monthInfo: EventAttributes = {
    title: title,
    calName: title,
    start: [Number(config.year), Number(config.month), 1, 9, 0],
    duration: { hours: 0, minutes: 30 },
    alarms: [
      {
        action: 'display',
        description: 'Reminder',
        trigger: { hours: 0, minutes: 1, before: true },
      },
    ],
    description: `\
其他月份日历：https://movie.wind8866.top
修改意见(New issue)：https://github.com/wind8866/movie-calendar/issues
数据更新日期：${dayjs(Date.now()).format('MM/DD HH:mm:ss')}

${config.month}月豆列(精红)
${config.douList[config.year + config.month]?.join('\n')}
`,
    categories: config.categories,
    url: 'https://movie.wind8866.top',
  }
  const alarmList: EventAttributes[] = [monthInfo]
  config.saleTime.forEach((date) => {
    const time = dayjs(date)
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
          trigger: { hours: 0, minutes: 11, before: true },
        },
      ],
      description: ``,
      categories: config.categories,
    })
  })
  return alarmList
}

export function createCalendar(calData: EventAttributes[]): string {
  const { error, value } = ics.createEvents(calData)
  return value ?? ''
}
