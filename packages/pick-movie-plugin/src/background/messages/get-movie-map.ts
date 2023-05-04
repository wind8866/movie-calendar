import type { IMovieInfo } from '@moviecal/spider-man/types'
import type { PlasmoMessaging } from '@plasmohq/messaging'
// @ts-ignore
import { queryMovieList } from '~background'

export type GetMovieMapRequest = undefined // 'douId' | 'movieList'

export type GetMovieMapResponse = {
  [k: number]: IMovieInfo
}

const handler: PlasmoMessaging.MessageHandler<
  null,
  GetMovieMapResponse
> = async (req, res) => {
  const movieList: IMovieInfo[] = await queryMovieList()
  const movieInfoMap: { [k: number]: IMovieInfo } = {}
  movieList.forEach((movie) => {
    movieInfoMap[movie.movieId] = movie
  })
  res.send(movieInfoMap)
}

export default handler
