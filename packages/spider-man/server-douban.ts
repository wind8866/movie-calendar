import { IMovieInfo, IZLGToDoubanMap } from './types'
import { pullDoubanInfoMap } from './server-oss'

export async function getDouToZLG(doubanMap: IZLGToDoubanMap, now: number) {
  const douToZlg: { updateTime: number; [k: number]: number } = {
    updateTime: now,
  }
  for (const movieId in doubanMap) {
    const { info } = doubanMap[movieId]
    if (Array.isArray(info)) {
      info.forEach((item) => {
        douToZlg[Number(item.doubanId)] = Number(movieId)
      })
    } else {
      douToZlg[Number(info.doubanId)] = Number(movieId)
    }
  }
  return douToZlg
}

export async function getDoubanDataUseCache(
  movieList: IMovieInfo[],
  now: number,
) {
  const doubanInfoMap = (await pullDoubanInfoMap()) ?? {}
  const douToZlg = await getDouToZLG(doubanInfoMap, now)
  return {
    douToZlg,
    doubanInfoMap,
  }
}
