$('body').append('<div id="squintbox"><div class="sq-close">❌</div><div class="sq-open">⬅️</div><div class="sq-container><div class="sq-el-title">Transcript</div><div id="sq-transcript"></div><div id="sq-news"></div></div></div>')

const state = {
  activeVideo: undefined,
  squintVideo: null,
  lookups:{},
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

// class VideoData {
//   constructor () {
//     this.lookup = MockData.reduce((obj, x) => {
//       obj[x.videoId] = x
//       return obj
//     }, {})
//   }
// }



function colorWords (selector, replaceWords) {
    let words = selector.text()
    words = words.replace(replaceWords, `<strong>${replaceWords}</strong>`)
    console.log(words)
    selector.html(words)
}

class Video {
  constructor (id, sentences) {
    this.sentences = sentences
    this.id = id
  }

  present (frame) {
    let replaceWords = null
    $('#sq-transcript').empty()
    const beforeNow = this.sentences.filter((e) => {
      return e.end + 2 > frame.currentTime && e.start - 2 < frame.currentTime
    })
    if (beforeNow.length) {
      var i = 0
      const texts = beforeNow.map((e) => {
        const $textel = $(`<span class="streamingtext${i}">${e.text} </span>`)
        i++;
        if (e.news) {
          Object.keys(e.news).forEach((key) => {
            const id= key.replace(/ /g, '-')
            if (!$('#sq-news').find(`#${id}`).length) {
              const $el = $(`<div id="${id}" class="sq-newsbox"></>`)
              $el.append(`<div class="sq-newstitle">${e.news[key].title}</div>`)
              $el.append(`<a class="sq-newslink" href="${e.news[key].url}">${e.news[key].url}</a>`)
              $el.append('<button>promote</button>')
              $('#sq-news').prepend($el)
            }
            replaceWords = key
          })
        }
        return $textel
      })
      $('#sq-transcript').append(texts)
      if (replaceWords) {
        colorWords($('.streamingtext0'), replaceWords)
        colorWords($('.streamingtext1'), replaceWords)
        colorWords($('.streamingtext2'), replaceWords)
      }
    }
  }
}

$(document).on('squint:videoChanged', (e, videoData) => {
  if (state.lookups[videoData.id] && state.lookups[videoData.id].sentences) {
    state.squintVideo = new Video(videoData.id, state.lookups[videoData.id].sentences)
  } else {
    $.getJSON(`https://raw.githubusercontent.com/vepkenez/squint-chrome-extension/master/data_prep/${videoData.id}`, function (resp, something) {
      state.lookups[videoData.id] = resp
    }).fail(function () {
      state.lookups[videoData.id] = true
      state.activeVideo = videoData.id
      state.squintVideo = null
    })
  }
})

// youtube playback events
$('video').on('timeupdate', (e) => {
  const frame = new CurrentFrame(e)
  if (state.activeVideo === undefined || (state.activeVideo && frame.id !== state.activeVideo)) {
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