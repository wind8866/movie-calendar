import chalk from 'chalk'
import dotent from 'dotenv'
import { IMovieInfo } from '../types'
import nodemailer from 'nodemailer'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dotent.config()
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.tz.setDefault('Asia/Shanghai')

export async function addedMovieMsgPush(movieList: IMovieInfo[]) {
  // 阿里云邮箱配置：https://help.aliyun.com/document_detail/36576.html
  const emailAddress = 'movie-robot@wind8866.top'
  const transporter = nodemailer.createTransport({
    host: 'smtp.qiye.aliyun.com',
    port: 465,
    secure: true,
    auth: {
      user: emailAddress,
      pass: process.env.EMAIL_PASS,
    },
  })
  const userList: string[] = []
  const time = dayjs.tz(Date.now())
  const today = `${time.month() + 1}月${time.date()}日`
  await transporter
    .sendMail({
      from: `"电影日历" <${emailAddress}>`,
      to: 'liuzhen1010xyz@gmail.com',
      bcc: userList,
      subject: `资料馆排片更新 ${today}`,
      html: `
<h1>今日（${today}）上新${movieList.length}部电影</h1>
${movieList
  .map((m) => {
    return `<div>${m.name}</div>`
  })
  .join('')}
<div><a href="https://movie.wind8866.top/">https://movie.wind8866.top/</a></div>
`,
    })
    .catch((error) => {
      console.log(chalk.red('[新上线推送]'), '推送失败')
      throw error
    })
  console.log(chalk.green('[新上线推送]'), '推送成功')
}

export async function sendComingMsg({
  type,
  msg,
  json,
}: {
  type: 'error' | 'warn' | 'log'
  msg: string
  json: string
}) {
  const emailAddress = 'movie-robot@wind8866.top'
  const transporter = nodemailer.createTransport({
    host: 'smtp.qiye.aliyun.com',
    port: 465,
    secure: true,
    auth: {
      user: emailAddress,
      pass: process.env.EMAIL_PASS,
    },
  })
  await transporter
    .sendMail({
      from: `"电影日历" <${emailAddress}>`,
      to: 'liuzhen1010xyz@qq.com',
      subject: `电影日历-豆瓣即将上映-${type}: ${msg}`,
      html: `
<h1>${type}: ${msg} - ${new Date()}</h1>
  <pre style="background: #333; padding: 10px; color: #fff; font-size: 13px;word-wrap: break-word; white-space: pre-wrap;">
    <code>
    ${json}
    </code>
  </pre>
`,
    })
    .catch((e) => {
      console.error('Error: Email sending failed!!', e?.message, e?.stack)
    })
}
export async function appMessagePushEmail({
  type,
  msg,
  json,
}: {
  type: 'error' | 'warn' | 'log'
  msg: string
  json: string
}) {
  console[type]?.(msg, new Date(), json)
  const emailAddress = 'movie-robot@wind8866.top'
  const transporter = nodemailer.createTransport({
    host: 'smtp.qiye.aliyun.com',
    port: 465,
    secure: true,
    auth: {
      user: emailAddress,
      pass: process.env.EMAIL_PASS,
    },
  })
  await transporter
    .sendMail({
      from: `"电影日历" <${emailAddress}>`,
      to: 'liuzhen1010xyz@gmail.com',
      subject: `${type}: ${msg}`,
      html: `
<h1>${type}: ${msg} - ${new Date()}</h1>
  <pre style="background: #333; padding: 10px; color: #fff; font-size: 13px;word-wrap: break-word; white-space: pre-wrap;">
    <code>
    ${json}
    </code>
  </pre>
`,
    })
    .catch((e) => {
      console.error('Error: Email sending failed!!', e?.message, e?.stack)
    })
}
