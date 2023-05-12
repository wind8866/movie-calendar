import chalk from 'chalk'
import dayjs from 'dayjs'
import { IMovieInfo } from '../types'
import { getAllData } from '../main'

export function logSoldState(movieList: IMovieInfo[]) {
  const sale80Up = movieList
    .map((m) => {
      let scale = 0
      let total = 0
      m.movieCinemaListMore?.forEach((info) => {
        if (info.playTime === m.playTime) {
          if (info.seatTotal == null || info.seatSold == null) return
          total = info.seatTotal
          scale =
            Math.round(
              ((info.seatTotal - info.seatSold) / info.seatTotal) * 10000,
            ) / 100
        }
      })
      return {
        name: m.name,
        scale,
        total,
        playTime: m.playTime,
        room: m.cinema + m.room,
      }
    })
    .filter((m) => m.scale >= 0.8)
  console.table(sale80Up)

  console.log('\n')
  const soldOutList = movieList
    .filter((m) => m.soldOut)
    .map((m) => ({
      name: m.name,
      playTime: m.playTime,
      room: m.cinema + m.room,
    }))
  console.log(
    chalk.bold.green(
      `截至${dayjs.tz(new Date()).format('DD日HH时mm分')}，共有${
        soldOutList.length
      }场售罄`,
    ),
  )
  console.table(soldOutList)
  console.log('\n')
}

async function completeProcess() {
  const allData = await getAllData()
  logSoldState(allData.movieList)
}
completeProcess()
