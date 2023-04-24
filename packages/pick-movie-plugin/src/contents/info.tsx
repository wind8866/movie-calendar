import type {
  PlasmoCSConfig,
  PlasmoGetInlineAnchor,
  PlasmoMountShadowHost,
} from 'plasmo'
// TODO: pnpm check error
// @ts-ignore
import cssText from 'data-text:~style.css'
import { useStorage } from '@plasmohq/storage/hook'
import type { MovieInfoSimple } from '../background'
import { useEffect, useState } from 'react'
import type { PrePickMovie } from '../popup'

export const getStyle = () => {
  const style = document.createElement('style')
  style.textContent = cssText
  return style
}

export const config: PlasmoCSConfig = {
  matches: ['https://movie.douban.com/subject/*'],
}
export const getInlineAnchor: PlasmoGetInlineAnchor = () =>
  document.querySelector('.aside') as Element
export const mountShadowHost: PlasmoMountShadowHost = ({
  shadowHost,
  anchor,
  observer,
}) => {
  anchor?.element.prepend(shadowHost)
  observer?.disconnect()
}
export const getShadowHostId = () => 'plasmo-inline-movie-timetable'

const movieInfo = () => {
  const [movieMap] = useStorage<{ [k: number]: MovieInfoSimple } | null>(
    'movieInfoMap',
    null,
  )
  const [idMapping] = useStorage<{ [k: number]: number } | null>(
    'idMapping',
    null,
  )
  const [info, setInfo] = useState<MovieInfoSimple | null>(null)

  useEffect(() => {
    if (movieMap == null || idMapping == null) {
      return
    }
    const href =
      document.querySelector<HTMLAnchorElement>('.feed a')?.href ?? ''
    const reg = /https:\/\/movie.douban.com\/feed\/subject\/(\d+)\/reviews/
    const doubanId = reg.exec(href)?.[1]
    if (doubanId == null) return
    const movieId = idMapping[Number(doubanId)]
    const infoDOMWrap = document.createElement('div')
    infoDOMWrap.classList.add('info-wrap')
    const movieInfo = movieMap[movieId]
    if (!movieInfo) return
    setInfo(movieInfo)
  }, [movieMap, idMapping])

  const [prePick, setPrePick] = useStorage<PrePickMovie>('prePickMap', {})
  const onToggle = (info: MovieInfoSimple) => {
    if (prePick[info.movieId] == null) {
      setPrePick({
        ...prePick,
        [info.movieId]: true,
      })
    } else {
      delete prePick[info.movieId]
      setPrePick({
        ...prePick,
      })
    }
  }

  if (info == null) return null
  const infoList: { label: string; value: string | number; hide?: boolean }[] =
    [
      { label: '影院', value: info.cinema + ' ' + info.room },
      { label: '活动', value: '有', hide: !info.isActivity },
      {
        label: '放映',
        value:
          info.playTime +
          ' 周' +
          ['日', '一', '二', '三', '四', '五', '六'][
            new Date(info.playTime).getDay()
          ],
      },
      { label: '时长', value: info.minute },
      { label: '票价', value: info.price },
    ]
  const checked = prePick[info.movieId] != null
  return (
    <div className="w-full bg-[#f4f4ec] p-[10px] mb-[20px]">
      <h2 className="text-[#007722] mb-[6px] mt-0 text-base font-sans leading-relaxed font-normal">
        电影资料馆放映&nbsp;·&nbsp;·&nbsp;·&nbsp;·&nbsp;·&nbsp;
      </h2>
      <div className="px-[6px]">
        {infoList.map((item) => {
          if (item.hide) return null
          return (
            <div key={item.label}>
              <span className="text-[#666] inline-block pr-1">
                {item.label}:
              </span>
              <span>{item.value}</span>
            </div>
          )
        })}
        <span
          className="text-[#37a] hover:text-white hover:bg-[#37a] cursor-pointer"
          onClick={() => onToggle(info)}
        >
          {checked ? '取消' : ''}预选
        </span>
      </div>
    </div>
  )
}

export default movieInfo
