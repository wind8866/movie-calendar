const { writeFileSync } = require('fs')
const ics = require('ics')
const dayjs = require('dayjs')
const localData = require('./data/gorgor.json')

const categories = [ '资料馆' ]
const config = {
  '小西天1号厅': true,
  '小西天2号厅': true,
  '百子湾1号厅': true,
  categories: categories,
  useLocal: true,
  alarm: {
    start: [ 2023, 2, 24, 12, 15 ],
    duration: { hours: 0, minutes: 30 },
    title: '❗️准备买票啊(12:15)',
    alarms: [{
      action: 'display',
      description: 'Reminder',
      trigger: { hours: 0, minutes: 16, before: true }
    }],
    description: `精红老师的豆列
23年全年：https://www.douban.com/doulist/153324641/
小西天1号厅：https://www.douban.com/doulist/154142836/
小西天2号厅+百子湾：https://www.douban.com/doulist/154144201/

标题中带🎉的是有活动的
反馈：liuzhen1010xyz@gmail.com
`,
    categories: categories,
  }
}
const createEventData = (movieList) => {
  return movieList.map(m => {
    let description = `${m.isActivity ? '有活动' : ''} ${m.price}元 ${m.cinema} ${m.room}`
    return {
      start: dayjs(m.playTime).format('YYYY MM DD HH mm').split(' ').map(str => Number(str)),
      duration: {
        hours: Math.floor(m.minute / 60),
        minutes: m.minute % 60
      },
      title: `${m.isActivity ? '🎉' : ''}${m.name} ${dayjs(m.movieTime).year()}`,
      description,
      categories: config.categories
    }
  })
}
const createCalendarStr = (movieList) => {
  const { error, value } = ics.createEvents(movieList)
  if (error) {
    console.log(error)
    throw new Error(error)
    return
  }
  return value
}

const writeFile = (str) => {
  let fileName = '202304'
  if (config['小西天1号厅'] && config['小西天2号厅'] && config['百子湾1号厅']) {
    fileName += '-all'
  } else if (config['小西天1号厅']) {
    fileName += '-xxt'
  } else if (config['小西天2号厅'] && config['百子湾1号厅']) {
    fileName += '-xxt2&bzw1'
  }
  writeFileSync(`${__dirname}/dist/ics/${fileName}.ics`, str)
  writeFileSync(`${__dirname}/dist/ics/202304-gorgor.ics`, str)
}

const eventData = createEventData(localData)
// eventData.unshift(config.alarm)
const CalendarStr = createCalendarStr(eventData)
// console.log(CalendarStr)
writeFile(CalendarStr)