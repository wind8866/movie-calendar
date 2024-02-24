import { IAllData, IMovieInfo } from '../types'
import dayjs from 'dayjs'
import { config } from '../config'
import { EventAttributes, createEvents } from 'ics'

import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { cutDirectorCN } from '@moviecal/utils'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.tz.setDefault('Asia/Shanghai')

export type LocalType = 'all' | 'xiaoxitian' | 'baiziwan'

export function createCalData(
  movieList: IMovieInfo[],
  localType: LocalType = 'all',
): EventAttributes[] {
  return movieList.map((m) => {
    let douURL: string | null = null
    const doubanInfo = m.doubanInfo?.douban
    if (doubanInfo != null && doubanInfo.length === 1) {
      douURL = `https://movie.douban.com/subject/${doubanInfo[0].id}/`
    }
    const director = m.movieActorList
      .filter((v) => v.position === '导演')
      .map((v) => cutDirectorCN(v.realName) ?? v.realName)
      .join('/')
    const otherDate = m.otherDate
      ?.filter((date) => date !== m.playTime)
      .map((date) => dayjs.tz(date).format('D'))
      .join(',')
    const _template = `
2001年 123分钟 中国香港
杜琪峰/韦家辉

40元 小西天艺术影院2号厅
#华语聚焦-2024年1月

评分7 人数104412
`
    interface TextItem {
      text: string | number | undefined
      before?: string
      next?: string
    }
    const textList: TextItem[][] = [
      // 基本信息
      [
        {
          text: dayjs.tz(m.movieTime).format('YYYY'),
          next: '年',
        },
        {
          text: m.minute,
          next: '分钟',
        },
        {
          text: (m.country ?? []).join('/'),
        },
      ],
      [
        {
          text: director,
        },
      ],
      // 放映信息
      [],
      [
        {
          text: m.price,
          next: '元',
        },
        {
          text: m.cinema + m.room,
        },
      ],
      [
        {
          text: m.isActivity ? '有放映活动' : '',
        },
        {
          text: otherDate,
          next: '日也有放映',
        },
      ],
      [
        {
          before: '#',
          text: m.topicName,
        },
      ],
    ]
    // 豆瓣信息
    if (doubanInfo != null) {
      textList.push([])
      doubanInfo.forEach((dou, index) => {
        const line: TextItem[] = [
          {
            before: '评分',
            text: dou.score,
          },
          {
            before: '人数',
            text: dou.commentCount,
          },
        ]
        if (doubanInfo.length > 1) {
          line.push({
            text: `https://movie.douban.com/subject/${dou.id}/`,
          })
        }
        textList.push(line)
      })
    }

    let description = ``
    textList.forEach((line, rowIndex) => {
      let lineText = ``
      line.forEach((item, colIndex) => {
        if (item.text != null && item.text !== '') {
          lineText += `${item.before ?? ''}${item.text}${item.next ?? ''}`
          if (colIndex !== line.length - 1) {
            lineText += ' '
          }
        }
      })
      if (lineText) {
        description += lineText
        if (rowIndex !== textList.length - 1) {
          description += `
`
        }
      }
      if (line.length === 0) {
        description += `
`
      }
    })
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
    const calConfig = {
      start,
      startInputType: 'utc',
      duration: {
        hours: Math.floor(m.minute / 60),
        minutes: m.minute % 60,
      },
      title,
      description,
      categories: ['资料馆'],
    }
    // @ts-ignore
    if (douURL) calConfig.url = douURL
    return calConfig
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
帮助文档💡：https://www.yuque.com/qifengle-z7w1e/vu76du/cfa-cal
销量榜单🔥：https://www.yuque.com/qifengle-z7w1e/vu76du/cfa-24top
意见反馈📩：电影群里@北风
更新日期🕙：${dayjs.tz(Date.now()).format('MM/DD HH:mm:ss')}
`,
    categories: ['资料馆'],
    url: 'https://movie.wind8866.top',
  }

  // 大年三十到初三，三十晚上下午8点自动提醒拜年
  // 2024/2/9 19:00 - 2024/2/17 23:00
  const yearStart = dayjs
    .tz('2024/2/10')
    .utc()
    .format('YYYY MM DD HH mm')
    .split(' ')
    .map((str) => Number(str)) as [number, number, number, number, number]
  const happyNewYear: EventAttributes = {
    title: '新年快乐🧨',
    calName: '新年快乐🧨',
    start: yearStart,
    startInputType: 'utc',
    duration: { days: 3, hours: 0, minutes: 0 },
    alarms: [
      {
        action: 'display',
        description: 'Reminder',
        trigger: { hours: 0, minutes: 1, before: true },
      },
    ],
    description: `\
祝各位影迷朋友
一帆风顺🚗
辞旧迎新🧨
龙腾虎跃🐲
阖家团员🥟🥢👨‍👩‍👧‍👦
红包多多🎁
期待在龙年电影能带给我们更多的惊喜与感动🥳
`,
    categories: ['资料馆'],
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
