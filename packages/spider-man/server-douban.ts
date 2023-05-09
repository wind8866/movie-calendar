import { IMovieInfo, ICFAToDoubanMap } from './types'
import { pullDoubanInfoMap } from './server-oss'

export async function getDouToCFA(
  movieIdToDouInfo: ICFAToDoubanMap,
  now: number,
) {
  const douToCFA: { updateTime: number; [k: number]: number } = {
    updateTime: now,
  }
  for (const movieId in movieIdToDouInfo) {
    const { info } = movieIdToDouInfo[movieId]
    if (Array.isArray(info)) {
      info.forEach((item) => {
        douToCFA[Number(item.doubanId)] = Number(movieId)
      })
    } else {
      douToCFA[Number(info.doubanId)] = Number(movieId)
    }
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
