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
  doubanInfoMap: IZLGToDoubanMap
  douToZlg: {
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
  doubanId: string
  score: number
  commentCount: number
  poster: string
  year: string
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
  doubanInfo?: IZLGToDoubanMap[number]
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
export interface IZLGToDoubanMap {
  // movieId
  [key: number]: {
    name: string
    updateTime: number
    info: IDoubanInfo | IDoubanInfo[]
  }
}
