import { sendComingMsg } from '../export/message-push'
import ComingMovie from './index'

async function runComingMovie() {
  try {
    const comingMovie = new ComingMovie()
    await comingMovie.pull()
    await comingMovie.parse()
    comingMovie.getCalTitle()
    await comingMovie.pushToOss()
    console.log('✅ coming movie done')

    sendComingMsg({
      type: 'log',
      msg: '成功',
      json: JSON.stringify(comingMovie.comingList),
    })
  } catch (error) {
    console.error('❌ coming movie error', error)
    sendComingMsg({
      type: 'error',
      msg: '失败',
      json: JSON.stringify(error),
    })
  }
}
runComingMovie()
