console.log('这里是豆瓣')

async function pullDouId() {
  const res = await fetch(
    'https://movie-data.wind8866.top/current/mapping-douid-movieid.json',
    {
      headers: {
        'Access-Control-Allow-Origin': 'https://movie.douban.com',
      },
    },
  )
  console.log(res)
  return res.json()
}
async function pullMovieInfoMap() {
  const res = await fetch(
    'https://movie-data.wind8866.top/current/mapping-movieid-douid.json',
  )
  console.log(res)
  return res.json()
}

async function main() {
  const idMapping = await pullDouId()
  const movieInfoMap = await pullMovieInfoMap()
  const wrap = document.querySelectorAll('.doulist-item')
  for (const dom of wrap) {
    dom.style.position = 'relative'
    const href = dom.querySelector('.title a').href
    const reg = /https:\/\/movie.douban.com\/subject\/(\d+)\//
    const doubanId = reg.exec(href)?.[1]
    const movieId = idMapping[doubanId]
    const infoDOMWrap = document.createElement('div')
    infoDOMWrap.classList.add('info-wrap')
    const movieInfo = movieInfoMap[movieId]
    if (!movieInfo) continue
    infoDOMWrap.innerHTML = [
      // `movieId: ${movieId}`,
      `放映时间: ${movieInfo.playTime}`,
      // TODO：假如统计说明
      '周几：周日',
      `放映影厅：${movieInfo.cinema} ${movieInfo.room}`,
      `票价：${movieInfo.price}`,
    ]
      .map((text) => `<div class="info-item">${text}</div>`)
      .join('')

    dom.appendChild(infoDOMWrap)

    const toggle = document.createElement('div')
    toggle.classList.add('toggle')
    infoDOMWrap.appendChild(toggle)
    // dom.querySelector('.toggle').parentElement.style.width = '16px'
    dom.querySelector('.toggle').addEventListener('click', (e) => {
      if (e.currentTarget.parentElement.style.width === '16px') {
        e.currentTarget.parentElement.style.width = '300px'
      } else {
        e.currentTarget.parentElement.style.width = '16px'
      }
    })
  }
  const styleDOM = document.createElement('style')
  styleDOM.type = 'text/css'
  styleDOM.innerText = `\
.info-wrap {
  box-sizing: border-box;
  position: absolute;
  max-height: 100%;
  left: 100%;
  width: 300px;
  padding: 16px;
  background: rgba(238, 238, 238, 0.47);
  margin-left: 16px;
  top: 0px;
  overflow: hidden;
}
.toggle {
  position: absolute;
  height: 100%;
  right: 0px;
  top: 0px;
  line-height: 100%;
  width: 300px;
  cursor: pointer;
}
.info-item {
  margin-bottom: 4px;
}
`
  document.head.appendChild(styleDOM)
}
main()
