import type {
  PlasmoCSConfig,
  PlasmoCSUIProps,
  PlasmoGetInlineAnchor,
  PlasmoGetInlineAnchorList,
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
  matches: ['https://www.douban.com/doulist/*'],
}
export const getInlineAnchorList: PlasmoGetInlineAnchorList = async () =>
  document.querySelectorAll('.doulist-item')
export const mountShadowHost: PlasmoMountShadowHost = ({
  shadowHost,
  anchor,
  observer,
}) => {
  anchor?.element.prepend(shadowHost)
  observer?.disconnect()
}
export const getShadowHostId = () => 'plasmo-inline-movie-timetable'

const movieInfo = ({ anchor }: PlasmoCSUIProps) => {
  const wrapDOM = anchor?.element
  if (wrapDOM == null) return
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
      wrapDOM.querySelector<HTMLAnchorElement>('.title a')?.href ?? ''
    const reg = /https:\/\/movie.douban.com\/subject\/(\d+)\//
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
    console.log(info)

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
    <div className="absolute min-h-full left-full w-[300px] p-4 bg-[#eeeeee78] ml-4 top-0 overflow-auto">
      <a id={`movie-id-${info.movieId}`}></a>
      <div>
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
