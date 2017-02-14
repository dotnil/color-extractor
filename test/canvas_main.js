'use strict'

var colorExtractor = require('../lib/color-extractor-canvas')
var ColorUtil = require('./color_util')

var imagePaths = []

for (var i = 1; i <= 74; i++) {
  imagePaths.push(`./img/${ i < 10 ? '0' + i : i }.jpg`)
}


var tbody = document.querySelector('tbody')

tbody.innerHTML = imagePaths.map(function(path) {
  return `<tr>
    <td class="img"><img src="${path}"></td>
    <td class="colors"></td>
    <td class="dominant"></td>`
}).join('')


function getColors(img) {
  return colorExtractor.getColor(img, {
    delta: 17,
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
    if (hsv.s < 0.1 || hsv.v < 0.4 || hsv.s > 0.95) {}
    else return { hex: colorObj.color, rgb: rgb, hsv: hsv }
  }

  colorObj = colors[0]
  return { hex: colorObj.color, rgb: rgb, hsv: hsv }
}

function setColors(img, result) {
  var td = img.closest('td')
  var colors = td.nextElementSibling
  var dominant = colors.nextElementSibling

  colors.appendChild(result.reduce(function(ul, color) {
    var li = document.createElement('li')
    var isBlackText = ColorUtil.luminosityContrastWithWhite(color.color) < 2
    var rgb = ColorUtil.hexToRgb(color.color)
    var hsv = ColorUtil.rgbToHsv(rgb.r, rgb.g, rgb.b)
    li.className = isBlackText ? '' : 'white-text'
    li.style.backgroundColor = '#' + color.color
    li.textContent = color.color + ' ' + Math.round(hsv.h) + ',' + parseInt(hsv.s * 100, 10) + ',' + parseInt(hsv.v * 100, 10)
    ul.appendChild(li)
    return ul
  }, document.createElement('ul')))

  var dominantColor = getDominentColor(result)
  dominant.style.backgroundColor = '#' + dominantColor.hex
  dominant.textContent = dominantColor.hex
  if (ColorUtil.luminosityContrastWithWhite(dominantColor.hex) >= 2) {
    dominant.className += ' white-text'
  }
}

Array.from(document.querySelectorAll('td.img img'), function(img) {
  img.onload = function() {
    getColors(img).then(function(result) {
      setColors(img, result)
    })
  }
})
