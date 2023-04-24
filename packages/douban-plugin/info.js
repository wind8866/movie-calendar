async function pullDouId() {
  const res = await fetch(
    'https://movie-data.oss-cn-hongkong.aliyuncs.com/current/mapping-douid-movieid.json',
  )
  return res.json()
}
async function pullMovieList() {
  const res = await fetch(
    'https://movie-data.oss-cn-hongkong.aliyuncs.com/current/movie-list.json',
  )
  return res.json()
}

async function main() {
  const idMapping = await pullDouId()
  const movieList = await pullMovieList()
  const movieInfoMap = movieList.reduce((pre, current) => {
    pre[current.movieId] = current
    return pre
  }, {})
  const sidebar = document.querySelector('.aside')
  const href = document.querySelector('.feed a').href
  const reg = /https:\/\/movie.douban.com\/feed\/subject\/(\d+)\/reviews/
  const doubanId = reg.exec(href)?.[1]
  const movieId = idMapping[doubanId]
  const infoDOMWrap = document.createElement('div')
  infoDOMWrap.classList.add('info-wrap')
  const movieInfo = movieInfoMap[movieId]
  if (!movieInfo) return
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

  sidebar.prepend(infoDOMWrap)

  // const toggle = document.createElement('div')
  // toggle.classList.add('toggle')
  // infoDOMWrap.appendChild(toggle)
  // // dom.querySelector('.toggle').parentElement.style.width = '16px'
  // infoDOMWrap.querySelector('.toggle').addEventListener('click', (e) => {
  //   if (e.currentTarget.parentElement.style.width === '16px') {
  //     e.currentTarget.parentElement.style.width = '300px'
  //   } else {
  //     e.currentTarget.parentElement.style.width = '16px'
  //   }
  // })
  const styleDOM = document.createElement('style')
  styleDOM.type = 'text/css'
  styleDOM.innerText = `\
.info-wrap {
  box-sizing: border-box;
  max-height: 100%;
  left: 100%;
  width: 300px;
  padding: 16px;
  background: #f4f4ed;
  margin-bottom: 20px;
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
