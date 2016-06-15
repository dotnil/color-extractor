
var shared = require('./color-extractor-shared')
var helper = require('../util/helper')

var PREVIEW_WIDTH = 150
var PREVIEW_HEIGHT = 150

function resizeImage(img, width, height) {
  var canvas = document.createElement('canvas')
  var context = canvas.getContext('2d')
  canvas.width = width
  canvas.height = height
  context.drawImage(img, 0, 0, width, height)
  return canvas
}

function imageColorAt(canvas, x, y) {
  var context = canvas.getContext('2d')
  var data = context.getImageData(x, y, 1, 1).data
  return { red: data[0], green: data[1], blue: data[2] }
}

function ColorExtractor() {

}

/**
 * Extract dominant colors from an image.
 * @param {(HTMLImageElement|Image)} img - An <img> node or JavaScript Image object
 * @param {Object} opts - Color extraction options
 * @param {Number} [opts.count=10] - The number of color being returned.
 * @param {Number} [opts.delta=16] - The amount of gap when quantizing color values. Lower values mean more accurate colors.
 * @param {Boolean} [opts.reduceGradients=true] - Whether reduce (not eliminate) gradient variants or not.
 * @param {Boolean} [opts.favorSaturated=false] - Whether make more satured colors appear at the front of the result or not.
 * @param {Boolean} [opts.neglectYellowSkin=false] - Whether weight less for yellow skin tone colors.
 */
ColorExtractor.prototype.getColor = function _getColor(img, opts) {
  var count = opts.count || 10
  var shouldReduceGradients = typeof opts.reduceGradients === 'boolean' ? opts.reduceGradients : true
  var isFavoringSaturated = typeof opts.favorSaturated === 'boolean' ? opts.favorSaturated : false
  var shouldNeglectYellowSkin = typeof opts.neglectYellowSkin === 'boolean' ? opts.neglectYellowSkin : false
  var delta = opts.delta || 16

  var halfDelta
  if (delta > 2) {
    halfDelta = delta / 2 - 1
  }
  else {
    halfDelta = 0
  }

  var scale = Math.min(PREVIEW_WIDTH / img.width, PREVIEW_HEIGHT / img.height)
  var width, height
  if (scale < 1) {
    width = Math.floor(scale * img.width)
    height = Math.floor(scale * img.height)
  }
  else {
    width = img.width
    height = img.height
  }

  var canvas = resizeImage(img, width, height)

  var x, y
  var color, hex, hexObj = {}, hexArr
  var gradients = {}
  var result = []

  for (y = 0; y < height; y++) {
    for (x = 0; x < width; x++) {
      color = imageColorAt(canvas, x, y)

      // Round the colors, to reduce the number of duplicate colors
      color.red = parseInt(((color.red + halfDelta) / delta), 10) * delta
      color.green = parseInt(((color.green + halfDelta) / delta), 10) * delta
      color.blue = parseInt(((color.blue + halfDelta) / delta), 10) * delta

      if (color.red > 255) color.red = 255
      if (color.green > 255) color.green = 255
      if (color.blue > 255) color.blue = 255

      hex = ('0' + color.red.toString(16)).substr(-2) +
        ('0' + color.green.toString(16)).substr(-2) +
        ('0' + color.blue.toString(16)).substr(-2)

      if (hexObj[hex]) {
        hexObj[hex]++
      }
      else {
        hexObj[hex] = 1
      }
    }
  }

  if (shouldReduceGradients) {
    hexArr = helper.keysAfterArsortNumeric(hexObj)
    hexArr.forEach(function(val) {
      if (!gradients[val]) {
        hex = shared.findAdjacent(val, gradients, delta)
        gradients[val] = hex
      }
      else {
        hex = gradients[val]
      }

      if (val !== hex) {
        hexObj[hex] += hexObj[val]
        hexObj[val] = 0
      }
    })
  }

  hexArr = helper.keysAfterArsortNumeric(hexObj)
  hexArr.forEach(function(val) {
    if (hexObj[val] !== 0) {
      result.push({ color: val, weight: hexObj[val] })
    }
  })

  if (count > 0) result = result.slice(0, count)

  if (isFavoringSaturated) {
    result.forEach(function(item) {
      item.weight = parseInt(item.weight * shared.favorSaturatedHue(
        parseInt(item.color.substr(0, 2), 16),
        parseInt(item.color.substr(2, 2), 16),
        parseInt(item.color.substr(4, 2), 16)
      ), 10)
    })
    result.sort(function(a, b) {
      return b.weight - a.weight
    })
  }

  if (shouldNeglectYellowSkin) {
    result.forEach(function (item) {
      var red = parseInt(item.color.substr(0, 2), 16)
      var green = parseInt(item.color.substr(2, 2), 16)
      var blue = parseInt(item.color.substr(4,2), 16)
      if (red > blue && red-blue < 70 && Math.abs((red+blue)/2-green) < 10) {
        item.weight = Math.sqrt(item.weight)
      }
    })
    result.sort(function(a, b) {
      return b.weight - a.weight
    })
  }

  return result
}

module.exports = new ColorExtractor()
