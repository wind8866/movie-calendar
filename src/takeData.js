require('dotenv').config()

process.env

const domain = process.env.DOMAIN
const prefix = process.env.API_PREFIX //  '/v5/api/movie/movieCinemaList'
const dayMovieList = process.env.API_DAY_MOVIE_LIST
let i = 0
let allList = []


const getDayList = (year = 2023, month = 4) => {
  return (new Array(31).fill('').map((_, index) => {
    return `${year}/${month.toString().padStart(2, '0')}/${index + 1}`
  }))
}


const queryLoop = (time) => {
  const url = domain + prefix + dayMovieList
  const options = {
    hostname: domain,
    port: 443,
    path: `${url}?now=${time}`,
    headers: {
      'Host': domain,
      'Cache-Control': 'no-cache',
      'Content-Type': 'application/json',
      'Transfer-Encoding': 'chunked'
    }
  }
  https.get(options, (res) => {
    const data = []
    res.on('data', chunk => {
      data.push(chunk)
    })
    res.on('end', () => {
      i++
      const res = JSON.parse(Buffer.concat(data).toString())
      allList = allList.concat(res.data)

      if (i < playDayList.length) {
        const time = parseInt(Math.random() * 20)
        setTimeout(() => {
          queryLoop(playDayList[i])
        }, time)
      } else {
        resolve(allList)
      }
    })
  })
}