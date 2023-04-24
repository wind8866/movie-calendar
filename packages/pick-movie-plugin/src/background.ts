import type { IMovieInfo } from '@moviecal/spider-man/types'
import { Storage } from '@plasmohq/storage'

async function queryDouId() {
  const res = await fetch(
    'https://movie-data.oss-cn-hongkong.aliyuncs.com/current/mapping-douid-movieid.json',
  )
  return res.json()
}
async function queryMovieList() {
  const res = await fetch(
    'https://movie-data.oss-cn-hongkong.aliyuncs.com/current/movie-list.json',
  )
  return res.json()
}
export interface MovieInfoSimple {
  movieId: IMovieInfo['movieId']
  name: IMovieInfo['name']
  otherDate: IMovieInfo['otherDate']
  playTime: IMovieInfo['playTime']
  price: IMovieInfo['price']
  cinema: IMovieInfo['cinema']
  room: IMovieInfo['room']
  isActivity: IMovieInfo['isActivity']
  minute: IMovieInfo['minute']
  saleTime: string[]
}
const main = async () => {
  console.log('run background')
  const idMapping = await queryDouId()
  const movieList = (await queryMovieList()) as IMovieInfo[]
  const movieListSimple: MovieInfoSimple[] = movieList.map((m) => {
    return {
      movieId: m.movieId,
      name: m.name,
      otherDate: m.otherDate,
      playTime: m.playTime,
      price: m.price,
      cinema: m.cinema,
      room: m.room,
      isActivity: m.isActivity,
      minute: m.minute,
      saleTime: m.movieCinemaListMore?.map((info) => info.saleTime) ?? [],
    }
  })
  const movieInfoMap: { [k: number]: MovieInfoSimple } = {}
  movieListSimple.forEach((movie) => {
    movieInfoMap[movie.movieId] = movie
  })
  const storage = new Storage()
  await storage.set('prePickMap', {})
  await storage.set('idMapping', idMapping)
  await storage.set('movieInfoMap', movieInfoMap)
}

main()
