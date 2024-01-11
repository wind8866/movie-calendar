import dayjs from 'dayjs'
import { ossServer } from '@moviecal/utils/oss'
import { queryMovie, queryMovieInfo, queryPlayDayList } from '../server/cfa'
import { addedMovieMsgPush } from '../export/message-push'

async function test() {
  // ;(async function () {
  //   const response = await iaxios<ResWrap<IPlayTimeList>>({
  //     url: `/movieInfo/1217`,
  //   })
  // })()
  // const playlist = await queryPlayDayList()
  // console.log(playlist)
  // const listSegment = await queryMovie('2023/04/09')
  // console.log(listSegment)
  // const otherInfo = await queryMovieInfo(1188)
  // console.log(otherInfo)
  // const info = await queryDoubanMovieInfo({
  //   name: '平原上的摩西',
  //   year: '2023',
  // })
  // console.log(info)
  // put('202304.json', `${process.cwd()}/data/zlg/202304.json`)
  // const putRes = await ossServer.put({
  //   servePath: `test/`,
  //   serveName: `test-oss.json`,
  //   localPath: `${process.cwd()}/spider-man/.cache/test-oss.json`,
  //   headers: {
  //     'x-oss-meta-timestamp': Date.now(),
  //     'x-oss-tagging': {
  //       type: 'json',
  //     },
  //   },
  // })
  // console.log(putRes)
  // const pullRes = await ossServer.pull({
  //   servePath: `test/`,
  //   serveName: `test-oss.json`,
  //   headers: {},
  // })
  // console.log(pullRes)
  // if (pullRes.res.status === 200) {
  //   const json = JSON.parse(pullRes.content.toString())
  //   console.log(json)
  // }
  // const encoder = new TextEncoder()
  // const result = await ossServer.put({
  //   servePath: `test/`,
  //   serveName: 'movie-list.json',
  //   local: Buffer.from(encoder.encode(JSON.stringify([{ a: '333' }]))),
  //   headers: {},
  // })
  // console.log(result)

  const all = [
    {
      soldOut: false,
      movieId: 58,
      name: '花为媒',
      minute: 112,
      cinema: '百子湾艺术影院',
      room: '1号厅',
      playTime: '2023-04-26 19:00:00',
      price: 10,
      isActivity: false,
      movieCateList: [
        {
          categoryId: 37,
          categoryName: '戏曲',
          categoryNameEn: null,
          type: null,
        },
        {
          categoryId: 53,
          categoryName: '评剧',
          categoryNameEn: null,
          type: null,
        },
      ],
      movieCinemaList: [{ playTime: '19:00', fares: 10 }],
      movieActorList: [
        { position: '导演', realName: '方荧' },
        { position: '编剧', realName: '吴祖光' },
        { position: '演员', realName: '新凤霞' },
        { position: '演员', realName: '李忆兰' },
        { position: '演员', realName: '赵丽蓉' },
      ],
      movieTime: '1963-01-01 00:00:00',
      otherDate: ['2023-04-26 19:00:00'],
      country: ['中国', '中国香港'],
      regionCategoryNameList: [
        { categoryName: '中国' },
        { categoryName: '中国香港' },
      ],
      movieCinemaListMore: [
        {
          saleTime: '2023-03-28 12:00:00',
          playTime: '2023-04-26 19:00:00',
          movieActiveDto: {
            id: 6735,
            movieId: 58,
            beforetype: null,
            beforetypeList: null,
            beforeremask: '',
            aftertype: null,
            aftertypeList: null,
            afterremask: '',
            filmShow: '',
            filmMusic: '',
            filmShow2: '',
            filmMusic2: '',
            filmShow3: 0,
            filmMusic3: 0,
            filmShow1: 0,
            filmMusic1: 0,
            saleTime: '2023-03-28 12:00:00',
            saleStatus: 2,
          },
        },
      ],
      doubanInfo: {
        updateTime: 1682063247082,
        name: '花为媒',
        info: {
          doubanId: '2357317',
          score: 9.3,
          commentCount: 3603,
          poster:
            'https://img1.doubanio.com/view/photo/s_ratio_poster/public/p2173058450.jpg',
          year: '1963',
        },
      },
    },
    {
      soldOut: false,
      movieId: 420,
      name: '偶然与想象',
      minute: 121,
      cinema: '百子湾艺术影院',
      room: '1号厅',
      playTime: '2023-04-21 19:00:00',
      price: 60,
      isActivity: false,
      movieCateList: [
        {
          categoryId: 15,
          categoryName: '剧情',
          categoryNameEn: null,
          type: null,
        },
        {
          categoryId: 16,
          categoryName: '爱情',
          categoryNameEn: null,
          type: null,
        },
      ],
      movieCinemaList: [{ playTime: '19:00', fares: 60 }],
      movieActorList: [
        { position: '导演', realName: '滨口龙介 Ryûsuke Hamaguchi' },
        { position: '演员', realName: '古川琴音 Kotone Furukawa' },
        { position: '演员', realName: '涩川清彦 Kiyohiko Shibukawa' },
        { position: '演员', realName: '中岛步 Ayumu Nakajima' },
      ],
      movieTime: '2021-03-04 00:00:00',
      otherDate: ['2023-04-21 19:00:00'],
      country: ['日本'],
      regionCategoryNameList: [{ categoryName: '日本' }],
      movieCinemaListMore: [
        {
          saleTime: '2023-03-28 12:00:00',
          playTime: '2023-04-21 19:00:00',
          movieActiveDto: {
            id: 6736,
            movieId: 420,
            beforetype: null,
            beforetypeList: null,
            beforeremask: '',
            aftertype: null,
            aftertypeList: null,
            afterremask: '',
            filmShow: '',
            filmMusic: '',
            filmShow2: '',
            filmMusic2: '',
            filmShow3: 0,
            filmMusic3: 0,
            filmShow1: 0,
            filmMusic1: 0,
            saleTime: '2023-03-28 12:00:00',
            saleStatus: 2,
          },
        },
      ],
      doubanInfo: {
        updateTime: 1682063247082,
        name: '偶然与想象',
        info: {
          doubanId: '35360296',
          score: 8.3,
          commentCount: 68344,
          poster:
            'https://img9.doubanio.com/view/photo/s_ratio_poster/public/p2687984714.jpg',
          year: '2021',
        },
      },
    },
    {
      soldOut: false,
      movieId: 827,
      name: '步履不停',
      minute: 114,
      cinema: '百子湾艺术影院',
      room: '1号厅',
      playTime: '2023-04-28 19:00:00',
      price: 50,
      isActivity: false,
      movieCateList: [
        {
          categoryId: 15,
          categoryName: '剧情',
          categoryNameEn: null,
          type: null,
        },
      ],
      movieCinemaList: [{ playTime: '19:00', fares: 50 }],
      movieActorList: [
        { position: '导演', realName: '是枝裕和 Hirokazu Koreeda' },
        { position: '编剧', realName: '是枝裕和 Hirokazu Koreeda' },
        { position: '演员', realName: '阿部宽 Hiroshi Abe' },
        { position: '演员', realName: '夏川结衣 Yui Natsukawa' },
        { position: '演员', realName: '树木希林 Kirin Kiki' },
      ],
      movieTime: '2008-06-28 00:00:00',
      otherDate: ['2023-04-28 19:00:00'],
      country: ['日本'],
      regionCategoryNameList: [{ categoryName: '日本' }],
      movieCinemaListMore: [
        {
          saleTime: '2023-03-28 12:00:00',
          playTime: '2023-04-28 19:00:00',
          movieActiveDto: {
            id: 6737,
            movieId: 827,
            beforetype: null,
            beforetypeList: null,
            beforeremask: '',
            aftertype: null,
            aftertypeList: null,
            afterremask: '',
            filmShow: '',
            filmMusic: '',
            filmShow2: '',
            filmMusic2: '',
            filmShow3: 0,
            filmMusic3: 0,
            filmShow1: 0,
            filmMusic1: 0,
            saleTime: '2023-03-28 12:00:00',
            saleStatus: 2,
          },
        },
      ],
      doubanInfo: {
        updateTime: 1682063247082,
        name: '步履不停',
        info: {
          doubanId: '2222996',
          score: 8.8,
          commentCount: 273591,
          poster:
            'https://img1.doubanio.com/view/photo/s_ratio_poster/public/p2375245718.jpg',
          year: '2008',
        },
      },
    },
    {
      soldOut: false,
      movieId: 122,
      name: '夜以继日',
      minute: 119,
      cinema: '百子湾艺术影院',
      room: '1号厅',
      playTime: '2023-04-23 13:30:00',
      price: 50,
      isActivity: false,
      movieCateList: [
        {
          categoryId: 15,
          categoryName: '剧情',
          categoryNameEn: null,
          type: null,
        },
        {
          categoryId: 16,
          categoryName: '爱情',
          categoryNameEn: null,
          type: null,
        },
      ],
      movieCinemaList: [{ playTime: '13:30', fares: 50 }],
      movieActorList: [
        { position: '导演', realName: '滨口龙介 Ryûsuke Hamaguchi' },
        { position: '编剧', realName: '田中幸子 Sachiko Tanaka' },
        { position: '编剧', realName: '滨口龙介 Ryûsuke Hamaguchi' },
        { position: '编剧', realName: '柴崎友香 Tomoka Shibasaki' },
        { position: '演员', realName: '东出昌大 Masahiro Higashide' },
        { position: '演员', realName: '唐田英里佳 Erika Karata' },
        { position: '演员', realName: '濑户康史 Koji Seto' },
      ],
      movieTime: '2018-01-01 00:00:00',
      otherDate: ['2023-04-23 13:30:00'],
      country: ['日本', '法国'],
      regionCategoryNameList: [
        { categoryName: '日本' },
        { categoryName: '法国' },
      ],
      movieCinemaListMore: [
        {
          saleTime: '2023-03-28 12:00:00',
          playTime: '2023-04-23 13:30:00',
          movieActiveDto: {
            id: 6738,
            movieId: 122,
            beforetype: null,
            beforetypeList: null,
            beforeremask: '',
            aftertype: null,
            aftertypeList: null,
            afterremask: '',
            filmShow: '',
            filmMusic: '',
            filmShow2: '',
            filmMusic2: '',
            filmShow3: 0,
            filmMusic3: 0,
            filmShow1: 0,
            filmMusic1: 0,
            saleTime: '2023-03-28 12:00:00',
            saleStatus: 2,
          },
        },
      ],
      doubanInfo: {
        updateTime: 1682063247082,
        name: '夜以继日',
        info: {
          doubanId: '27037053',
          score: 7.7,
          commentCount: 49508,
          poster:
            'https://img1.doubanio.com/view/photo/s_ratio_poster/public/p2518349518.jpg',
          year: '2018',
        },
      },
    },
    {
      soldOut: false,
      movieId: 158,
      name: '欢乐时光',
      minute: 318,
      cinema: '百子湾艺术影院',
      room: '1号厅',
      playTime: '2023-04-23 16:00:00',
      price: 100,
      isActivity: false,
      movieCateList: [
        {
          categoryId: 15,
          categoryName: '剧情',
          categoryNameEn: null,
          type: null,
        },
      ],
      movieCinemaList: [{ playTime: '16:00', fares: 100 }],
      movieActorList: [
        { position: '导演', realName: '滨口龙介 Ryûsuke Hamaguchi' },
        { position: '编剧', realName: '滨口龙介 Ryûsuke Hamaguchi' },
        { position: '编剧', realName: '野原位 Tadashi Nohara' },
        { position: '编剧', realName: '高桥知由 Tomoyuki Takahashi' },
        { position: '演员', realName: '田中幸惠 Sachie Tanaka' },
        { position: '演员', realName: '菊池叶月 Hazuki Kikuchi' },
        { position: '演员', realName: '三原麻衣子 Maiko Mihara' },
      ],
      movieTime: '2015-01-01 00:00:00',
      otherDate: ['2023-04-23 16:00:00'],
      country: ['日本'],
      regionCategoryNameList: [{ categoryName: '日本' }],
      movieCinemaListMore: [
        {
          saleTime: '2023-03-28 12:00:00',
          playTime: '2023-04-23 16:00:00',
          movieActiveDto: {
            id: 6751,
            movieId: 158,
            beforetype: null,
            beforetypeList: null,
            beforeremask: '',
            aftertype: null,
            aftertypeList: null,
            afterremask: '',
            filmShow: '',
            filmMusic: '',
            filmShow2: '',
            filmMusic2: '',
            filmShow3: 0,
            filmMusic3: 0,
            filmShow1: 0,
            filmMusic1: 0,
            saleTime: '2023-03-28 12:00:00',
            saleStatus: 2,
          },
        },
      ],
      doubanInfo: {
        updateTime: 1682063247082,
        name: '欢乐时光',
        info: {
          doubanId: '26550176',
          score: 8.6,
          commentCount: 11966,
          poster:
            'https://img2.doubanio.com/view/photo/s_ratio_poster/public/p2298735591.jpg',
          year: '2015',
        },
      },
    },
  ]

  addedMovieMsgPush(all)
}
async function main() {
  await test()
  console.log('end')
}
main()
