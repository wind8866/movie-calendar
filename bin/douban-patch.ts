import dayjs from 'dayjs'
import fsPromise from 'node:fs/promises'
// import { config, wFile } from './index'
import { IMovieInfo } from './types'

const config = {
  localPath: `${process.cwd()}/data/zlg`,
  year: '2023',
  month: '04',
}

async function main() {
  const localFilePath = `${config.localPath}/${config.year}${config.month}.json`
  console.log(localFilePath)

  const movieListFormat: IMovieInfo[] = JSON.parse(
    (await fsPromise.readFile(localFilePath)).toString(),
  )
  const doubanQueryList = movieListFormat.map((movie) => {
    return {
      movieId: movie.movieId,
      name: movie.name,
      year: dayjs(movie.movieTime).format('YYYY'),
    }
  })
  await fsPromise.writeFile(
    `${config.localPath}/douban-query-${config.year}${config.month}.cache.json`,
    JSON.stringify(doubanQueryList),
  )
  console.log('Successful! 🎉')
}
main()
