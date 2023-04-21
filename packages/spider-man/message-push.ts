import chalk from 'chalk'
import dotent from 'dotenv'
import { IMovieInfo } from './types'
import nodemailer from 'nodemailer'

dotent.config()

async function sendMail(movieList: IMovieInfo[]) {
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
  const info = await transporter.sendMail({
    from: `"电影日历" <${emailAddress}>`,
    to: 'liuzhen1010xyz@gmail.com',
    bcc: userList,
    subject: '资料馆排片更新 4月15日',
    html: `
<h1>今日（4月15日）上新${movieList.length}部电影</h1>
<ul>
  ${movieList
    .map((m) => {
      return `<li>${m.name} ${m.playTime}</li>`
    })
    .join('<br>')}
</ul>
<p>详情见附件</p>
`,
  })
  console.log(info)
}

export async function messagePush(movieList: IMovieInfo[]) {
  await sendMail(movieList)
  console.log(chalk.green('[推送] ') + 'email')
}
