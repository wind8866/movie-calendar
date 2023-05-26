// movieId查询movieId
// data/cfa-to-dou-dic-map.json
export interface CFAToDouDic {
  movieId: number // CFA movie Id(899)
  movieName: string // 电影名(情书)
  movieMinute: number // 电影时长(150)
  movieTime: string // 电影年份(1995)
  douban: {
    // 有时连映电影一次放映好几部，对应多个电影信息，所以这里是Map形式
    id: number // douId(1292220)
    name: string // 电影名(情书) 少数电影名字并不完全对应
    score: number // 豆瓣评分(8.9)，没有数据时是0
    commentCount: number // 评论人数(1093944)，没有数据时是0
    poster: string // 豆瓣的封面(https://img2.doubanio.com/view/photo/raw/public/p2648230660.jpg)
    year: number // 豆瓣的电影年份(1995)
  }[]

  updateTime: number // 获取当前数据的日期，时间戳(1684287500071)
  remark?: string // 可选属性，对一些特殊情况加以说明(可参考一江春水向东流的备注)
}
export interface CFAToDouDicMap {
  [key: number]: CFAToDouDic
}

// movieId查询movieId
// data/dou-to-cfa-dic-map.json
export interface DouToCFADic {
  s?: string // 电影名，这里采用简洁的方式是因为访问次数多，为了节省带宽
  i: number // movieId
}
export interface DouToCFADicMap {
  [douId: number]: DouToCFADic[]
}

export interface IAllData {
  now: number
  playDate: {
    dayList: string[]
    month: (string | undefined)[]
  }
  movieList: IMovieInfo[]
  addedMovie: IMovieInfo[]
  movieListRaw: {
    updateTime: number
    list: IServerMovieItem[]
  }
  movieInfoMapRaw: IMovieInfoList
  cfaToDou: ICFAToDoubanMap
  douToCFA: {
    [k: number]: number
    updateTime: number
  }
  saleTimeList: Set<string>
}

export interface IServerMovieItem {
  movieId: number
  movieName: string
  movieMinute: number
  cinemaName: string
  movieHall: string
  playTime: string
  fares: number
  isActivity: '0' | '1'
  movieCateList: {
    categoryId: number
    categoryName: string
    categoryNameEn: null
    type: null
  }[]
  movieCinemaList: { playTime: string; fares: number }[]
  movieActorList: { position: string; realName: string }[]
  movieTime: string
}

export interface IDoubanInfo {
  id: number
  name: string
  score: number
  commentCount: number
  poster: string
  year: number
}
export interface IMovieInfo {
  movieId: number
  name: string
  minute: number
  cinema: string
  room: string
  playTime: string
  price: number
  isActivity: boolean
  soldOut: boolean
  movieCateList: {
    categoryId: number
    categoryName: string
    categoryNameEn: null
    type: null
  }[]
  movieCinemaList: { playTime: string; fares: number }[]
  movieActorList: { position: string; realName: string }[]
  movieTime: string

  saleTime?: string
  country?: string[]
  otherDate?: string[]
  regionCategoryNameList?: IServerMovieInfo['regionCategoryNameList']
  movieCinemaListMore?: IServerMovieInfo['movieCinemaList']
  doubanInfo?: ICFAToDoubanMap[number]
}

export interface IServerMovieInfo {
  movieId: number
  movieName: string
  movieMinute: number
  movieTime: string
  regionCategoryNameList: {
    categoryName: string
  }[]
  movieCinemaList: {
    saleTime: string
    playTime: string
    seatTotal?: number
    seatSold?: number
    movieActiveDto: {
      saleTime: string
    }
  }[]
}

export interface IDoubanSearchItem {
  episode: string
  id: string
  img: string
  sub_title: string
  title: string
  type: string
  url: string
  year: string
}

export interface IPlayTimeList {
  currentMonth?: {
    month: string // '4'
    cinemaDateDtoList: {
      playTime: string // '2023-04-06'
      isActivity: boolean
    }[]
  }
  nextMonth?: IPlayTimeList['currentMonth']
  cinemaNames: string[]
}

export interface IMovieInfoList {
  updateTime: number
  [key: number]: IServerMovieInfo
}

/** key: movieId */
export interface ICFAToDoubanMap {
  // movieId
  [key: number]: {
    name: string
    updateTime: number
    douban: IDoubanInfo[]
  }
}
