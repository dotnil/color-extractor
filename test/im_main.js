/* global ColorUtil */

var imagePaths = []

for (var i = 1; i <= 74; i++) {
  imagePaths.push(('0' + i).substr(-2))
}

imagePaths = imagePaths.map(function(sequence) {
  return '/~lingzheng/central_modules/color-extract/test/img/' + sequence + '.jpg'
})

function getDominentColor(colors) {
  var colorObj, rgb, hsv
  for (var i = 0; i < colors.length; i++) {
    colorObj = colors[i]
    rgb = ColorUtil.hexToRgb(colorObj.color)
    hsv = ColorUtil.rgbToHsv(rgb.r, rgb.g, rgb.b)
    if (hsv.s < 0.1 || hsv.v < 0.4 || hsv.s > 0.95) {}
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
  window.imTestResult.forEach(function(result, i) {
    insertRow(i, result)
  })
}

main()
