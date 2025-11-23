// import ComingMovie from '../index'

import { EventAttributes } from 'ics'

describe('ComingMovie', () => {
  let ComingMovie: any
  let comingMovie: any
  // const comingMovie = new ComingMovie()

  beforeAll(async () => {
    // 在模块被导入前提供一个简单的 global.File 实现，防止模块评估时访问 File 抛错
    // 如需更完整行为可扩展此类
    // TODO: 这里不是正常做法，可能是框架没有检查导致的，需进一步考虑
    // @ts-ignore
    global.File = class {
      constructor() {}
    }

    // 动态导入，确保在我们 mock 了 File 之后再加载模块
    const mod = await import('../index')
    ComingMovie = mod.default
  })

  beforeEach(() => {
    comingMovie = new ComingMovie()
  })

  test('拉取coming数据', async () => {
    // const result = await comingMovie.pull()
    // expect(result).toBeDefined()
    // expect(typeof result).toBe('string')
    // expect(result.length).toBeGreaterThan(0)
  })

  const sampleHtml = `
    <table width="100%" class="coming_list">
      <tbody>
        <tr>
          <td>11月26日</td>
          <td>
            <a
              href="https://movie.douban.com/subject/26817136/"
              title="疯狂动物城2 Zootopia 2"
              >疯狂动物城2</a
            >
          </td>
          <td>喜剧 / 犯罪 / 动画</td>
          <td>美国</td>
          <td>227082人 想看</td>
        </tr>
      </tbody>
    </table>
  `

  test('解析coming的html', async () => {
    const result = await comingMovie.parse(sampleHtml)
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      id: '26817136',
      day: expect.stringContaining('11月26日'),
      title: '疯狂动物城2',
      link: 'https://movie.douban.com/subject/26817136/',
      tags: '喜剧/犯罪/动画',
      region: '美国',
      watch: 227082,
      unit: 'day',
    })
  })

  //  getCalTitle
  test('生成日历标题', () => {
    const calTitle: EventAttributes = comingMovie.getCalTitle()
    expect(calTitle).toBeDefined()
    expect(calTitle.start).toHaveLength(5)
    expect([2025, 2026, 2027, 2028].includes(calTitle.start[0])).toBe(true)
  })
})
