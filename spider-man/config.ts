import { IServerMovieInfo, IServerMovieItem } from './types'

export const config = {
  categories: ['资料馆'],
  year: '2023',
  month: '04',
  days: 31,
  useLocal: true,
  cache: false,
  printLog: true,
  doubanCookie: ``,
  localPath: `${process.cwd()}/data/zlg`,
  saleTime: new Set<string>(),
  douList: [
    '4月小西天1号厅：https://www.douban.com/doulist/154478483/',
    '4月小西天2号厅+百子湾：https://www.douban.com/doulist/154478797/',
  ],
  roomTitleShort: {
    小西天艺术影院1号厅: '',
    小西天艺术影院2号厅: '2号厅',
    百子湾艺术影院1号厅: '百子湾',
  } as { [k: string]: string },
}
