export interface IServerMovieItemInfo extends IDoubanInfo {
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
  otherInfo?: IServerMovieInfo
}

export interface IDoubanInfo {
  doubanId?: string
  score?: number
  commentCount?: number
}
export interface IMovieInfo extends IDoubanInfo {
  name: string
  minute: number
  cinema: string
  room: string
  playTime: string
  price: number
  isActivity: boolean
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
}
export interface ICal {}

export interface IServerMovieInfo {
  regionCategoryNameList: {
    categoryName: string
  }[]
  movieCinemaList: {
    saleTime: string
    playTime: string
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
