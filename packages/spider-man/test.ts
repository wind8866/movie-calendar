import dayjs from 'dayjs'
import { queryDoubanMovieInfo } from './server-douban'
import { ossServer } from './server-oss'
import { queryMovie, queryMovieInfo, queryPlayDayList } from './server-zlg'

async function test() {
  // const playlist = await queryPlayDayList()
  // console.log(playlist)
  // const listSegment = await queryMovie('2023/04/09')
  // console.log(listSegment)
  // const otherInfo = await queryMovieInfo(1188)
  // console.log(otherInfo)
  // const info = await queryDoubanMovieInfo({
  //   name: '平原上的摩西',
  //   year: '2023',
  // })
  // console.log(info)
  // put('202304.json', `${process.cwd()}/data/zlg/202304.json`)
  // const putRes = await ossServer.put({
  //   servePath: `test/`,
  //   serveName: `test-oss.json`,
  //   localPath: `${process.cwd()}/spider-man/.cache/test-oss.json`,
  //   headers: {
  //     'x-oss-meta-timestamp': Date.now(),
  //     'x-oss-tagging': {
  //       type: 'json',
  //     },
  //   },
  // })
  // console.log(putRes)
  // const pullRes = await ossServer.pull({
  //   servePath: `test/`,
  //   serveName: `test-oss.json`,
  //   headers: {},
  // })
  // console.log(pullRes)
  // if (pullRes.res.status === 200) {
  //   const json = JSON.parse(pullRes.content.toString())
  //   console.log(json)
  // }

  const encoder = new TextEncoder()
  const result = await ossServer.put({
    servePath: `latest/`,
    serveName: 'movie-list.json',
    local: new Buffer(encoder.encode(JSON.stringify([{ a: '333' }]))),
    headers: {},
  })
  console.log(result)
}
async function main() {
  await test()
  console.log('end')
}
main()
