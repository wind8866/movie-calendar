export const getDayList = (year = 2023, month = 4) => {
  return (new Array(31).fill('').map((_, index) => {
    const monthFormat = String(month).padStart(2, '0')
    const dayFormat = String(index + 1).padStart(2, '0')
    return `${year}/${monthFormat}/${dayFormat}`
  }))
}