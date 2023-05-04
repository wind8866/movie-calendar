import { useEffect, useMemo, useState } from 'react'
import Papa from 'papaparse'
import { useStorage } from '@plasmohq/storage/hook'
import dayjs from 'dayjs'
import toCSV from '@moviecal/spider-man/to-csv'
import { createCalData, createCalendar } from '@moviecal/spider-man/to-ics'

import '~style.css'
import type { IMovieInfo } from '@moviecal/spider-man/types'
import { sendToBackground } from '@plasmohq/messaging'
// @ts-ignore
// import type {
//   GetMovieMapRequest,
//   GetMovieMapResponse,
// } from '~background/messages/get-movie-map'

export interface PrePickMovie {
  [movieId: number]: boolean
}
function IndexPopup() {
  const [idMapping, setIDMapping] = useStorage<{ [id: number]: number }>(
    'idMapping',
    {},
  )
  const [prePickMap, setPrePick] = useStorage<PrePickMovie>('prePickMap', {})

  const [movieMap, setMovieMap] = useState<{ [k: number]: IMovieInfo }>({})
  useEffect(() => {
    // sendToBackground<any, GetMovieMapResponse>({
    //   name: 'get-movie-map',
    //   body: {},
    // }).then((result) => {
    //   setMovieMap(result)
    // })
  }, [])

  function onChecked(id: number) {
    setPrePick({
      ...prePickMap,
      [id]: !prePickMap[id],
    })
  }
  function onDelete(id: number) {
    delete prePickMap[id]
    setPrePick({
      ...prePickMap,
    })
  }
  const onCheckedAll: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    console.log(e.target.checked)
    const target = e.target.checked
    const newObj: PrePickMovie = {}
    for (const id in prePickMap) {
      newObj[id] = target
    }
    setPrePick(newObj)
  }
  const checkboxAll = useMemo(() => {
    return Object.values(prePickMap).every((v) => v)
  }, [prePickMap])

  const onExportExcel = async () => {
    let checked: IMovieInfo[] = []
    for (const id in prePickMap) {
      if (prePickMap[id] && movieMap[id]) checked.push(movieMap[id])
    }
    checked = checked.sort(
      (pre, current) => +new Date(pre.playTime) - +new Date(current.playTime),
    )
    const cvsStr = toCSV(checked)
    const blob = new Blob([cvsStr], { type: 'text/csv' })
    const typedBlob = new Blob([blob], { type: 'text/csv' })
    // TODO: pnpm type error
    // @ts-ignore
    await chrome.downloads.download({
      filename: `待看的电影-${dayjs().format('MM月DD日')}.csv`,
      url: URL.createObjectURL(typedBlob),
      conflictAction: 'uniquify',
    })
  }
  const onExportICS = async () => {
    const checked: IMovieInfo[] = []
    for (const id in prePickMap) {
      if (prePickMap[id] && movieMap[id]) checked.push(movieMap[id])
    }
    const calObject = createCalData(checked)
    const calString = await createCalendar(calObject)
    const blob = new Blob([calString], { type: 'text/calendar' })
    const typedBlob = new Blob([blob], { type: 'text/calendar' })
    // TODO: pnpm type error
    // @ts-ignore
    await chrome.downloads.download({
      filename: `待看的电影-${dayjs().format('MM月DD日')}.ics`,
      url: URL.createObjectURL(typedBlob),
      conflictAction: 'uniquify',
    })
  }

  const onClearCache = async () => {
    if (window.confirm('确定清空缓存数据？')) {
      setPrePick({})
      setMovieMap({})
      setIDMapping({})
    }
  }

  return (
    <div className="min-w-[450px] p-2">
      <h2 className="mt-0 mb-3">
        资料馆电影日历小助手 <small>v1.0</small>
      </h2>
      <div className="flex mb-2">
        <span
          onClick={onExportExcel}
          className="text-[#37a] cursor-pointer inline-block mr-3 text-xs leading-5"
        >
          导出表格
        </span>
        <span
          onClick={onExportICS}
          className="text-[#37a] cursor-pointer inline-block mr-3 text-xs leading-5"
        >
          导出日历
        </span>
        <span
          onClick={onClearCache}
          className="text-[#37a] cursor-pointer inline-block mr-3 text-xs leading-5"
        >
          清空缓存
        </span>
      </div>
      <div className="overflow-auto min-h-20 max-h-[300px]">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#e3ebec]">
              <th className="font-normal py-1 px-1.5 text-left border border-solid border-[#e3ebec]">
                <input
                  onChange={onCheckedAll}
                  type="checkbox"
                  checked={checkboxAll}
                />
              </th>
              <th className="font-normal py-1 px-1.5 text-left border border-solid border-[#e3ebec]">
                电影名
              </th>
              <th className="font-normal py-1 px-1.5 text-left border border-solid border-[#e3ebec]">
                放映日期
              </th>
              <th className="font-normal py-1 px-1.5 text-left border border-solid border-[#e3ebec]">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(prePickMap).map((key) => {
              const id = Number(key)
              const name = movieMap[id]?.name
              const playTime = movieMap[id]?.playTime
              return (
                <tr key={id}>
                  <td className="border border-solid border-slate-100 py-1 px-1.5">
                    <input
                      onChange={() => onChecked(id)}
                      type="checkbox"
                      checked={prePickMap[id]}
                    />
                  </td>
                  <td className="border border-solid border-slate-100 py-1 px-1.5">
                    {name}
                  </td>
                  <td className="border border-solid border-slate-100 py-1 px-1.5">
                    {playTime}
                  </td>
                  <td className="border border-solid border-slate-100 py-1 px-1.5">
                    <span
                      className="text-[#37a] cursor-pointer"
                      onClick={() => onDelete(id)}
                    >
                      删除
                    </span>
                  </td>
                  {/* <a href={`https://movie.douban.com/subject/${m.douId}/`}>
              </a> */}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default IndexPopup
