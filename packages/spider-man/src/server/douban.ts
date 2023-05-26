import { IMovieInfo, ICFAToDoubanMap } from '../types'
import { pullDoubanInfoMap } from '../server/oss'

export async function getDouToCFA(
  movieIdToDouInfo: ICFAToDoubanMap,
  now: number,
) {
  const douToCFA: { updateTime: number; [k: number]: number } = {
    updateTime: now,
  }
  for (const movieId in movieIdToDouInfo) {
    const { douban } = movieIdToDouInfo[movieId]
    douban.forEach((item) => {
      douToCFA[Number(item.id)] = Number(movieId)
    })
  }
  return douToCFA
}

export async function getDoubanDataUseCache(
  movieList: IMovieInfo[],
  now: number,
) {
  const cfaToDou = (await pullDoubanInfoMap()) ?? {}
  const douToCFA = await getDouToCFA(cfaToDou, now)
  return {
    douToCFA,
    cfaToDou,
  }
}
