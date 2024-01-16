import path from 'node:path'
import { doubanSpecial } from '../data/douban-special'
import { readFileSync, writeFileSync } from 'node:fs'
import { CFAToDouDicMap, DouToCFADicMap } from '../types'
import same from './same.json'
export interface Douban {
  doubanId: number
  douName: string
  douyear: number
  commentCount: number
  score: number
  poster: string
  movieId: number
  movieName: string
  movieMinute: number
  movieTime: string
}

const remarks: { [id: number]: string } = {
  903: '《一江春水向东流》分为八年离乱和天亮前后上下两集，总时长192分钟，资料馆时长92分钟，可能是只播放了后集',
  491: '错误页面',
  494: '错误页面',
}

const time = Date.now()
const chacePath = path.resolve(__dirname, '../.cache')
const dataPath = path.resolve(__dirname, '../data')
const todoPickPath = `${chacePath}/todo-pick-list.json`
const cfaToDouDicMapPath = `${dataPath}/cfa-to-dou-dic-map.json`
const douToCFADicMapPath = `${dataPath}/dou-to-cfa-dic-map.json`

async function pick() {
  const todoPickStr = await readFileSync(todoPickPath, {
    encoding: 'utf-8',
    flag: 'r',
  })
  const cfaToDouDicMapStr = await readFileSync(cfaToDouDicMapPath, {
    encoding: 'utf-8',
    flag: 'r',
  })
  const todoPick: Douban[] = JSON.parse(todoPickStr)
  const cfaToDouDicMap: CFAToDouDicMap = JSON.parse(cfaToDouDicMapStr)
  const different: [number, string][] = []
  for (const current of todoPick) {
    const id = current.movieId
    if (cfaToDouDicMap[id]) continue
    if (doubanSpecial[id]) {
      cfaToDouDicMap[id] = {
        movieId: current.movieId,
        movieName: current.movieName,
        movieMinute: current.movieMinute,
        movieTime: current.movieTime,
        updateTime: doubanSpecial[id].updateTime,
        douban: doubanSpecial[id].douban,
      }
      if (remarks[id]) cfaToDouDicMap[id].remark = remarks[id]
      continue
    }
    if (same.includes(Number(id))) {
      cfaToDouDicMap[id] = {
        movieId: current.movieId,
        movieName: current.movieName,
        movieMinute: current.movieMinute,
        movieTime: current.movieTime,
        updateTime: time,
        douban: [
          {
            id: current.doubanId,
            name: current.douName,
            year: current.douyear,
            score: current.score,
            commentCount: current.commentCount,
            poster: current.poster,
          },
        ],
      }
      continue
    }
    different.push([id, current.movieName])
  }
  writeFileSync(cfaToDouDicMapPath, JSON.stringify(cfaToDouDicMap))
  console.log(JSON.stringify(different))
}

async function erverseMap() {
  const cfaToDouDicMapStr = await readFileSync(cfaToDouDicMapPath, {
    encoding: 'utf-8',
    flag: 'r',
  })
  const cfaToDouDicMap: CFAToDouDicMap = JSON.parse(cfaToDouDicMapStr)
  const douToCFADicMap: DouToCFADicMap = {}

  for (const movieId in cfaToDouDicMap) {
    const current = cfaToDouDicMap[movieId]
    for (const douban of current.douban) {
      if (!Array.isArray(douToCFADicMap[douban.id])) {
        douToCFADicMap[douban.id] = []
      }
      if (current.douban.length > 1) {
        douToCFADicMap[douban.id].push({
          s: current.movieName,
          i: current.movieId,
        })
      } else {
        douToCFADicMap[douban.id].unshift({
          s: current.movieName,
          i: current.movieId,
        })
      }
    }
  }
  writeFileSync(douToCFADicMapPath, JSON.stringify(douToCFADicMap))
  console.log(JSON.stringify(douToCFADicMap))
}

// pick()
// erverseMap()
