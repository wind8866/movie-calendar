import { getDayList, getTime } from '..'

test('should show 4 or 5', () => {
  expect(getTime(4, 5)).toBeGreaterThanOrEqual(4)
  expect(getTime(4, 5)).toBeLessThanOrEqual(5)
})

test('should show 2023-05-04', () => {
  expect(getDayList('2023', '5', 2)).toEqual(['2023-05-01', '2023-05-02'])
})

// sleep
