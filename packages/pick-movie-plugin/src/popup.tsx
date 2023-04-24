import { useMemo } from 'react'
import Papa from 'papaparse'
import { useStorage } from '@plasmohq/storage/hook'
import dayjs from 'dayjs'

import '~style.css'
import type { MovieInfoSimple } from './background'

function toCSV(movieList: MovieInfoSimple[]): string {
  const printList = movieList.map((m, index) => {
    return [
      m.name,
      // dayjs(m.saleTime).format('MM月DD日 HH:mm'),
      dayjs(m.playTime).format(`MM月DD日`),
      '周' + '日一二三四五六'[dayjs(m.playTime).day()],
      dayjs(m.playTime).format('HH:mm'),
      // m.minute,
      m.cinema + m.room,
      m.price,
      m.isActivity ? '有' : '',
      // m.movieCinemaListMore?.length,
      // m.movieCateList.map((cate) => cate.categoryName).join(','),
      // 'director',
      // score,
      '',
    ]
  })
  return Papa.unparse({
    fields: [
      '电影名',
      // '售票时间',
      '放映日期',
      '周几',
      '放映时间',
      // '时长',
      '影厅',
      '票价',
      '活动',
      // '多场放映',
      // '年份',
      // '国家|地区',
      // '类型',
      // '导演',
      // '豆瓣评分',
      // '评论人数',
      // '豆瓣链接',
      '备注',
    ],
    data: printList,
  })
}

export interface PrePickMovie {
  [movieId: number]: boolean
}
function IndexPopup() {
  const [prePickMap, setPrePick] = useStorage<PrePickMovie>('prePickMap', {})
  const [movieMap] = useStorage<{ [id: number]: MovieInfoSimple }>(
    'movieInfoMap',
    {},
  )
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
  console.log(prePickMap)

  const onExportExcel = async () => {
    let checked: MovieInfoSimple[] = []
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
    // TODO
  }

  const onClearCache = () => {
    if (window.confirm('确定清空缓存数据？')) {
      // TODO clear
    }
  }

  return (
    <div className="min-w-[320px] p-2">
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
      <div className="overflow-auto min-h-20 max-h-[100vh]">
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
