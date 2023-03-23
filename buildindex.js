const { writeFileSync } = require('fs')

const url = 'https://movie.wind8866.top/ics'
const list = [
  {fileName: '202304-all.ics', title: '4月全部'},
  {fileName: '202304-gorgor.ics', title: '张国荣特别版'},
]

const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title></title>
</head>
<body>
电影资料馆日历订阅
<ul>
${list.map(data => {
  return `<li style="margin-bottom: 0.5em;">
  <a href="./ics/${data.fileName}">${data.title}: </a>
  <code style="display: inline-block;margin-left: 1em; background: #ddd; padding: 4px">${url + '/' + data.fileName}</code>
</li>`
}).join('\n')}
</ul>
</body>
</html>`
writeFileSync(`${__dirname}/dist/index.html`, html)