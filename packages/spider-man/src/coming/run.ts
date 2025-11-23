import ComingMovie from './index'

const comingMovie = new ComingMovie()
comingMovie.pull().then((data) => {
  console.log('coming data:', data)
})
