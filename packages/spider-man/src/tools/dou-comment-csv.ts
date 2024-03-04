import Papa from 'papaparse'
// https://movie.douban.com/people/shadanbbi/collect?start=150&sort=time&rating=all&mode=grid&type=all&filter=all
function mainScript() {
  //   const list = []
  //   document.querySelectorAll('.item.comment-item').forEach((item) => {
  //     const time = item.querySelector('.date')
  //     const rote = time.previousElementSibling?.classList.value
  //     const useful = item.querySelector('.pl')?.innerText ?? 0
  //     list.push({
  //       电影名: item.querySelector('.title a').innerText,
  //       评论时间: time.innerText,
  //       电影地址: item.querySelector('.title a').href,
  //       评分: rote ? Number(/rating(\d)-t/.exec(rote)?.[1]) : null,
  //       有用: useful ? Number(/\((\d) 有用\)/.exec(useful)?.[1]) : null,
  //       评语: item.querySelector('.comment')?.innerText,
  //     })
  //   })
  //   copy(JSON.stringify(list))
  //   document.querySelector('.next a')?.click()
}

import { sha } from '../.cache/douban-person/shadan'
import { bayou } from '../.cache/douban-person/8.5'

import path from 'path'
import dayjs from 'dayjs'
import { writeFileSync } from 'fs'

const list = bayou.flat()
const cvsStr = Papa.unparse({
  fields: Object.keys(list[0]),
  data: list,
})
// const chacePath = path.resolve(
//   __dirname,
//   `../.cache/douban-person/shadan-${dayjs().format('MMDD')}.csv`,
// )
const chacePath = path.resolve(
  __dirname,
  `../.cache/douban-person/bayou-${dayjs().format('MMDD')}.csv`,
)
const encoder = new TextEncoder()
const buffer = Buffer.from(encoder.encode(cvsStr))
writeFileSync(chacePath, buffer)
