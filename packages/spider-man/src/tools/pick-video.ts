import same from './same.json'
import { doubanSpecial } from '../data/douban-special'
import {
  hostname,
  queryMovieActorList,
  queryMovieInfo,
  queryMovieLibrryInfo,
  queryMovieTrailerList,
} from '../server/cfa'
import dayjs from 'dayjs'
import Papa from 'papaparse'
import path from 'path'
import { writeFileSync } from 'node:fs'
import cfaToDouDicMap from '../data/cfa-to-dou-dic-map.json'
import { CFAToDouDicMap } from '../types'

const videoList: number[] = []
const errorList: { [k: number]: string } = {}
const voidList: number[] = [
  0, 33, 83, 204, 294, 303, 313, 326, 361, 376, 384, 447, 450, 463, 466, 467,
  469, 470, 471, 474, 475, 477, 478, 479, 480, 481, 486, 487, 488, 489, 490,
  492, 493, 495, 496, 525, 526, 527, 530, 532, 546, 555, 557, 560, 564, 567,
  569, 571, 572, 573, 575, 578, 581, 582, 583, 584, 586, 587, 590, 591, 593,
  594, 596, 599, 602, 604, 607, 608, 609, 610, 611, 612, 614, 617, 618, 619,
  620, 622, 623, 624, 626, 627, 628, 629, 630, 631, 632, 633, 634, 635, 636,
  637, 638, 639, 640, 641, 642, 644, 646, 647, 648, 650, 651, 652, 654, 655,
  656, 657, 659, 660, 661, 662, 663, 664, 666, 669, 670, 671, 672, 673, 675,
  676, 677, 678, 680, 681, 682, 686, 687, 734, 735, 740, 758, 772, 796, 799,
  818, 824, 826, 856, 857, 858, 859, 860, 861, 862, 863, 864, 865, 866, 867,
  869, 870, 871, 1025, 1026, 1027, 1028, 1029, 1030, 1031, 1032, 1035, 1050,
  1055, 1093, 1096, 1101, 1102, 1103, 1104, 1105, 1106, 1107, 1108, 1109, 1110,
  1111, 1116, 1117, 1118, 1120, 1121, 1129, 1134, 1139, 1151, 1153, 1220, 1233,
  1235, 1250, 1263, 1264, 1265, 1267, 1269, 1270, 1273, 1275, 1276, 1286, 1287,
  1343, 1349, 1354, 1374, 1382, 1383, 1384, 1385, 1386, 1388, 1389, 1390, 1398,
  1416, 1419, 1421, 1422, 1423, 1424, 1433, 1441, 1442, 1453, 1455, 1485, 1498,
  1499, 1504, 1516, 1523, 1534, 1542, 1544, 1548, 1549, 1550, 1551, 1552, 1553,
  1554, 1555, 1556, 1557, 1558, 1559, 1560,
]
const end = 1560
const start = 0
const limit = end
for (let i = start; i <= end; i++) {
  if (doubanSpecial[i]) continue
  if (same.includes(i)) continue
  videoList.push(i)
}
// console.log(videoList)
let count = 0
const dic: {
  id: number
  映后标题: string
  '关联影人/影片': string
  简介: string
  活动方式: string
  日期: string
  语言: string
  映后人员: string
  时长: string
  视频地址: string
  网页地址: string
  备注: string
}[] = []
async function pull() {
  for (const id of videoList) {
    if (count > limit) break
    if (voidList.includes(id)) break
    const res = await queryMovieLibrryInfo(id)
    if (res) {
      const actorList = await queryMovieActorList(id)
      const actorText = actorList
        .map((item) => {
          let role = item.position
          if (item.portrayName) role = item.portrayName
          return `${item.realName}(${role})`
        })
        .join(',')
      const guess = /《(.*)》/.exec(res.movieName)?.[1] ?? ''
      const videoInfo = await queryMovieTrailerList(id)
      dic.push({
        id: res.movieId,
        映后标题: res.movieName,
        '关联影人/影片': guess,
        简介: res.intro,
        活动方式: res.movieCateList.map((item) => item.categoryName).join(','),
        日期: dayjs(res.movieTime).format('YYYY-MM-DD'),
        语言: res.languageCategoryNameList
          .map((item) => item.categoryName)
          .join(','),
        映后人员: actorText,
        时长: videoInfo.map((item) => item.duration).join(','),
        视频地址: videoInfo.map((item) => item.prevue).join(','),
        网页地址: `https://${hostname}/h5/share.html?id=${id}&type=1`,
        备注: '',
      })
    } else {
      const res = await queryMovieInfo(id)
      errorList[id] = JSON.stringify(res)
      console.log('失败', id, res)
    }
    count++
  }
  // console.table(dic)
  console.log(errorList)
  console.log(JSON.stringify(errorList))

  const cvsStr = Papa.unparse({
    fields: Object.keys(dic[0]),
    data: dic.map((m) => Object.values(m)),
  })

  const chacePath = path.resolve(
    __dirname,
    `../.cache/pick/${dayjs().format('DD-HHmmss')}.csv`,
  )
  const encoder = new TextEncoder()
  const buffer = Buffer.from(encoder.encode(cvsStr))
  writeFileSync(chacePath, buffer)
}
// pull()
// ❗️整理日期：2024-01-15

// /h5/share.html?id=1417&type=1

function checkMovie() {
  console.log(Object.values(doubanSpecial).map((m) => [m.id, m.name]))

  // const sameHaveButMapNot: number[] = []
  // same.forEach((id) => {
  //   if (!(cfaToDouDicMap as unknown as CFAToDouDicMap)[id]) {
  //     sameHaveButMapNot.push(id)
  //   }
  // })
  // const mapHaveButSameNot: number[] = []
  // for (const id in cfaToDouDicMap) {
  //   if (!same.includes(Number(id))) {
  //     mapHaveButSameNot.push(Number(id))
  //   }
  // }
  // console.log(sameHaveButMapNot)
  // console.log('mapHaveButSameNot', mapHaveButSameNot)

  const havedMovie: {
    id: number
    movieName: string
  }[] = []
  for (const [id, m] of Object.entries(cfaToDouDicMap)) {
    havedMovie.push({
      id: Number(id),
      movieName: m.movieName,
    })
  }
  const cvsStr = Papa.unparse({
    fields: Object.keys(havedMovie[0]),
    data: havedMovie.map((m) => Object.values(m)),
  })
  const chacePath = path.resolve(__dirname, `../.cache/pick/已经有的电影.csv`)
  const encoder = new TextEncoder()
  const buffer = Buffer.from(encoder.encode(cvsStr))
  writeFileSync(chacePath, buffer)
}
// 已检查，没有遗漏
// checkMovie()
