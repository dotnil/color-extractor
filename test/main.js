/* global ColorUtil, ColorExtractor */

var imagePaths = []

for (var i = 0; i <= 74; i++) {
  imagePaths.push(('0' + i).substr(-2))
}

imagePaths = imagePaths.map(function(sequence) {
  return './img/' + sequence + '.jpg'
})

function loadImage(path) {
  return new Promise(function(resolve, reject) {
    var img = new Image()
    img.onload = function() {
      resolve(img)
    }
    img.src = path
  })
}

function extractColors(img) {
  var extractor = new ColorExtractor()
  // extractor.kmeans(img)
  return extractor.getColor(img, {
    delta: 17,
    reduceGradients: true,
    neglectYellowSkin: true,
    favorSaturated: true
  })
}

function getDominentColor(colors) {
  var colorObj, rgb, hsv
  for (var i = 0; i < colors.length; i++) {
    colorObj = colors[i]
    rgb = ColorUtil.hexToRgb(colorObj.color)
    hsv = ColorUtil.rgbToHsv(rgb.r, rgb.g, rgb.b)
    if (hsv.s < 0.1 || hsv.v < 0.4) {}
    else return { hex: colorObj.color, rgb: rgb, hsv: hsv }
  }

  colorObj = colors[0]
  return { hex: colorObj.color, rgb: rgb, hsv: hsv }
}

function insertRow(i, colors) {
  var table = document.getElementById('table')
  var tbody = table.tBodies[0]

  var tr = document.createElement('tr')

  var colImg = document.createElement('td')
  colImg.className = 'img'
  var img = document.createElement('img')
  img.src = imagePaths[i]
  colImg.appendChild(img)

  var colColors = document.createElement('td')
  colColors.className = 'colors'
  var colorsList = document.createElement('ul')
  colors.forEach(function(color) {
    var li = document.createElement('li')
    var isBlackText = ColorUtil.luminosityContrastWithWhite(color.color) < 2 ? true : false
    var rgb = ColorUtil.hexToRgb(color.color)
    var hsv = ColorUtil.rgbToHsv(rgb.r, rgb.g, rgb.b)
    li.className = isBlackText ? '' : 'white-text'
    li.style.backgroundColor = '#' + color.color
    li.textContent = color.color + ' ' + Math.round(hsv.h) + ',' + parseInt(hsv.s * 100, 10) + ',' + parseInt(hsv.v * 100, 10)
    colorsList.appendChild(li)
  })
  colColors.appendChild(colorsList)

  var colDominant = document.createElement('td')
  colDominant.className = 'dominant'
  var dominantColor = getDominentColor(colors)
  colDominant.style.backgroundColor = '#' + dominantColor.hex
  colDominant.textContent = dominantColor.hex
  if (ColorUtil.luminosityContrastWithWhite(dominantColor.hex) >= 2) {
    colDominant.className += ' white-text'
  }

  tr.appendChild(colImg)
  tr.appendChild(colColors)
  tr.appendChild(colDominant)

  tbody.appendChild(tr)
}

function main() {
  imagePaths.forEach(function(filepath, i) {
    loadImage(filepath)
      .then(extractColors)
      .then(function(colors) {
        insertRow(i, colors)
      })
  })
}

main()
