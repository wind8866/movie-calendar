import '@plasmohq/messaging/background'
import type { IMovieInfo } from '@moviecal/spider-man/types'
import { Storage } from '@plasmohq/storage'
export async function queryDouId() {
  const res = await fetch(
    'https://movie-data.oss-cn-hongkong.aliyuncs.com/current/mapping-douid-movieid.json',
  )
  return res.json()
}
export async function queryMovieList() {
  const res = await fetch(
    'https://movie-data.oss-cn-hongkong.aliyuncs.com/current/movie-list.json',
  )
  return res.json()
}

export const init = async () => {
  console.log('run background')
  const idMapping = await queryDouId()
  const movieList: IMovieInfo[] = await queryMovieList()
  const movieInfoMap: { [k: number]: IMovieInfo } = {}
  movieList.forEach((movie) => {
    movieInfoMap[movie.movieId] = movie
  })

  const storageLocal = new Storage({
    area: 'local',
  })
  await storageLocal.set('movieInfoMap', movieInfoMap)

  const storage = new Storage()
  await storage.set('idMapping', idMapping)
  await storage.set('prePickMap', {})
}
init()
