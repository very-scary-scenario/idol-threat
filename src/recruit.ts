import { CATALOG_FULL, Idol, agency } from './game'
import { askUser, numFromString } from './util'

import Quagga from '@ericblade/quagga2'

const barcodeImage = document.getElementById('barcode-image') as HTMLInputElement
const scannerOverlay = document.getElementById('scanner-overlay')!

const decoderConfig = {
  readers: [
    'ean_reader',
    'upc_reader',
  ],
}

let CAMERA_DENIED = false

function recruitIdolFromBarcodeText(text: string): Idol {
  const idol = new Idol(numFromString(text))
  idol.applyRecruitmentBonuses()
  agency.addIdol(idol, true)
  return idol
}

barcodeImage.addEventListener('change', function() {
  if (barcodeImage.files === null) { return }
  if (agency.full()) {
    askUser(CATALOG_FULL)
    return
  }

  Quagga.decodeSingle({
    decoder: decoderConfig,
  })

  Quagga.decodeSingle({
    decoder: decoderConfig,
    locate: true,
    src: window.URL.createObjectURL(barcodeImage.files[0]),
  }, (data) => {
    const code = data?.codeResult?.code
    if (code) {
      recruitIdolFromBarcodeText(code)
    } else {
      askUser(
        'Sorry, we couldn\'t read a barcode in that picture, please try a clearer photo.',
        [
          {command: 'Try again', action: () => { barcodeImage.click() }},
          {command: 'Cancel'},
        ]
      )
    }
  })
})

Quagga.onProcessed(function(data) {
  const drawingCtx = Quagga.canvas.ctx.overlay
  const drawingCanvas = Quagga.canvas.dom.overlay
  drawingCtx.clearRect(0, 0, parseInt(drawingCanvas.getAttribute('width')!), parseInt(drawingCanvas.getAttribute('height')!))

  if (!data) { return }

  if (data.boxes) {
    data.boxes.filter(function (box) {
      return box !== data.box
    }).forEach(function (box) {
      Quagga.ImageDebug.drawPath(box, {x: 0, y: 1}, drawingCtx, {color: 'green', lineWidth: 2})
    })
  }
  if (data.codeResult && data.codeResult.code) {
    scannerOverlay.classList.add('hidden')
    Quagga.stop()
    // alert(`${data.codeResult.format}: ${data.codeResult.code}`)
    recruitIdolFromBarcodeText(data.codeResult.code)
  }
})


function startQuagga() {
  Quagga.init({
    inputStream: {
      name: 'Live',
      type: 'LiveStream',
      target: document.getElementById('scanner-viewfinder')!,
    },
    decoder: decoderConfig,
  }, (error) => {
    if (error !== undefined) {
      CAMERA_DENIED = true
      scannerOverlay.classList.add('hidden')
      askUser('Without camera access, you will need to provide a static image', [
        {command: 'Load image', action: function() { barcodeImage.click() }},
        {command: 'Never mind'},
      ])
      console.log(error)
      return
    }

    Quagga.start()
    scannerOverlay.classList.remove('hidden')
  })
}

export function recruit() {
  if (CAMERA_DENIED) {
    barcodeImage.click()
  } else {
    startQuagga()
  }
}

export function stopRecruiting() {
  Quagga.stop()
  scannerOverlay.classList.add('hidden')
}
