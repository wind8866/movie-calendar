import { queryDoubanMovieInfo } from './get-douban-info'
import { fetchMovie, fetchMovieInfo } from './server'

async function test() {
  // const listSegment = await fetchMovie('2023/04/03')
  // console.log(listSegment)

  // const otherInfo = await fetchMovieInfo(1188)
  // console.log(otherInfo)

  // 获取豆瓣接口
  const info = await queryDoubanMovieInfo({
    name: '平原上的摩西',
    year: '2021',
  })
  console.log(info)
}
async function main() {
  await test()
  console.log('end')
}
main()
