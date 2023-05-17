# douId 与 movieId 映射关系 API

- douId: 豆瓣电影的电影 ID，例如《情书》的 douId 是`1292220`，那么豆瓣电影的对应页面是：`https://movie.douban.com/subject/1292220/` - movieId(CFA ID): 资料馆的电影 ID，例如《情书》的 movieId 是`899`，那么资料馆电影的对应页面是：`https://yt5.cfa.org.cn/h5/share.html?id=899`
- 本接口只统计了电影，不包括映后、影评等短视频内容（后面会做一个表格收集可播放的映后、影评、导演专访等内容）
- 80%的数据是用 node 爬虫获取的，少部分是手动填写的，并且手动审核筛选了一遍。但无法保证 100%正确，如有错误请指正，🙏
- 本接口会持续更新

### 接口类型说明

见[types 文件](https://github.com/wind8866/movie-calendar/blob/main/packages/spider-man/src/types.ts#L1-L33)

### movieId 查 douId

`https://movie-data.wind8866.top/current/cfa-to-dou-dic-map.json` [访问](https://movie-data.wind8866.top/current/cfa-to-dou-dic-map.json)

[GitHub 归档](https://github.com/wind8866/movie-calendar/tree/main/packages/spider-man/src/data/cfa-to-dou-dic-map.json)

### douId 查 movieId

`https://movie-data.wind8866.top/current/dou-to-cfa-dic-map.json` [访问](https://movie-data.wind8866.top/current/dou-to-cfa-dic-map.json)

[Github 归档](https://github.com/wind8866/movie-calendar/tree/main/packages/spider-man/src/data/dou-to-cfa-dic-map.json)

### 示例代码

```js
const path = `https://movie-data.wind8866.top/current/cfa-to-dou-dic-map.json`
async function getData() {
  const string = await fetch(path)
  const data = await string.json()
  console.log(data)
  return data
}
getData()
```
