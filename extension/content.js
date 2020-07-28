$('body').append('<div id="squintbox"><div class="sq-close">❌</div><div class="sq-open">⬅️</div><div class="sq-container><div class="sq-el-title">Transcript</div><div id="sq-transcript"></div><div id="sq-news"></div></div></div>')

const state = {
  activeVideo: null,
  squintVideo: null
}

class CurrentFrame {
  constructor (e) {
    const searchParams = new window.URLSearchParams(new URL(e.currentTarget.baseURI).search)
    const videoId = searchParams.get('v')

    this.url = e.currentTarget.baseURI
    this.currentTime = e.currentTarget.currentTime
    this.title = e.currentTarget.title
    this.id = videoId
  }
}

class VideoData {
  constructor () {
    this.lookup = MockData.reduce((obj, x) => {
      obj[x.videoId] = x
      return obj
    }, {})
  }
}

const Vids = new VideoData()

class Video {
  constructor (videodata) {
    this.data = videodata.sentenceWise[0]
    this.id = videodata.videoId
  }

  present (frame) {
    $('#sq-transcript').empty()
    const beforeNow = this.data.sentences.filter((e) => {
      return e.end + 2 > frame.currentTime && e.start - 2 < frame.currentTime
    })
    if (beforeNow.length) {
      var i = 0
      const texts = beforeNow.map((e) => {
        const $textel = $(`<span class="streamingtext${i}">${e.text} </span>`)
        i++;
        if (e.news && $textel.find('strong').length) {
          const key = $textel.find('strong').text()
          const id= key.replace(' ', '-')
          if (!$('#sq-news').find(`#${id}`).length) {
            const $el = $(`<div id="${id}" class="sq-newsbox"></>`)
            $el.append(`<div class="sq-newstitle">${e.news[key].title}</div>`)
            $el.append(`<a class="sq-newslink" href="${e.news[key].url}">${e.news[key].url}</a>`)
            $el.append('<button>promote</button>')
            $('#sq-news').prepend($el)
          }
        }
        return $textel
      })
      $('#sq-transcript').append(texts)
    }
  }
}

$(document).on('squint:videoChanged', (e, videoData) => {
  if (Vids.lookup[videoData.id]) {
    state.squintVideo = new Video(Vids.lookup[videoData.id])
  }
})

// youtube playback events
$('video').on('timeupdate', (e) => {
  const frame = new CurrentFrame(e)
  if (!state.activeVideo || frame.id !== state.activeVideo.id) {
    $(document).trigger('squint:videoChanged', frame)
  }
  if (state.squintVideo) {
    state.squintVideo.present(frame)
  }
})

// UI events
$('.sq-close').click((e) => {
  e.preventDefault()
  e.stopPropagation()
  $('#squintbox').addClass('sq-hide')
})

$('.sq-open').click((e) => {
  e.preventDefault()
  e.stopPropagation()
  $('#squintbox').removeClass('sq-hide')
})