/**
 * Get the most common colors in an image.
 * Modified from a PHP script, learn more here
 * http://www.coolphptools.com/color_extract
 */

var fs = require('fs')
var http = require('http')
var https = require('https')
var path = require('path')
var exec = require('child_process').exec

var co = require('co')
var uuid = require('uuid')

var shared = require('./color-extractor-shared')
var helper = require('../util/helper')

var PREVIEW_WIDTH = 150
var PREVIEW_HEIGHT = 150

function downloadFile(url, dest) {
  return new Promise(function(resolve, reject) {
    var file = fs.createWriteStream(dest)
    var protocol = /^https/.test(url) ? https : http
    protocol.get(url, function(response) {
      response.pipe(file)
      file.on('finish', function() {
        file.close(function() {
          resolve()
        })
      })
    }).on('error', function(err) {
      fs.unlink(dest)
      reject(err)
    })
  })
}

function readFile(filePath) {
  return new Promise(function(resolve, reject) {
    fs.readFile(filePath, {
      encoding: 'utf8'
    }, function(err, contents) {
      if (err) reject(err)
      else resolve(contents)
    })
  })
}

function removeFile(filePath) {
  return new Promise(function(resolve, reject) {
    fs.unlink(filePath, function(err) {
      if (err) reject(err)
      else resolve()
    })
  })
}

function *resizeAndGetImageData(imgPath) {
  var ext = path.extname(imgPath)
  var tmpDirAndBase = path.join(__dirname, 'tmp', '' + uuid.v4())
  var tmpImgPath = tmpDirAndBase + ext
  var tmpTxtPath = tmpDirAndBase + '.txt'

  var isOnlineImage = false

  if (/^https?/.test(imgPath)) {
    isOnlineImage = true
    yield downloadFile(imgPath, tmpImgPath)
    imgPath = tmpImgPath
  }

  yield new Promise(function(resolve, reject) {
    exec([
      'convert',
      imgPath,
      '-unsharp 1.5x1+0.7+0.02', // value from http://www.imagemagick.org/Usage/resize/
      '-resize', PREVIEW_WIDTH + 'x' + PREVIEW_HEIGHT + '\!',
      tmpTxtPath
    ].join(' '), function(err) {
      if (err) reject(new Error('Having error writing image data to file'))
      else resolve()
    })
  })

  var contents = yield readFile(tmpTxtPath)
  var imageData = {}
  var lines = contents.split(/\n/)
  lines.shift()
  lines.forEach(function(line) {
    // Each line looks like this, may have an empty line at EOF
    // 21,145: (215,216,221,1)  #D7D8DDFF  srgba(215,216,221,1)
    var parts = line.split(/\s+/)
    if (parts.length === 4) {
      imageData[parts[0].slice(0, -1)] = parts[2].substring(1, 7)
    }
  })

  if (isOnlineImage) {
    yield removeFile(tmpImgPath)
  }

  yield removeFile(tmpTxtPath)

  return imageData
}

function imageColorAt(imageData, x, y) {
  var key = x + ',' + y
  var hex = imageData[key]

  if (hex) {
    return {
      red: parseInt(hex.substr(0, 2), 16),
      green: parseInt(hex.substr(2, 2), 16),
      blue: parseInt(hex.substr(4,2), 16)
    }
  }

  return { red: 0, gren: 0, blue: 0 }
}

function ColorExtractor() {

}

/**
 * Extract dominant colors from an image.
 * @param {(HTMLImageElement|Image)} img - An <img> node or JavaScript Image object
 * @param {Object} opts - Color extraction options
 * @param {Number} [opts.count=10] - The number of color being returned.
 * @param {Number} [opts.delta=16] - The amount of gap when quantizing color values. Lower values mean more accurate colors.
 * @param {Boolean} [opts.reduceBrightness=true] - Whether reduce (not eliminate) brightness variants or not.
 * @param {Boolean} [opts.reduceGradients=true] - Whether reduce (not eliminate) gradient variants or not.
 * @param {Boolean} [opts.favorSaturated=false] - Whether make more satured colors appear at the front of the result or not.
 * @param {Boolean} [opts.neglectYellowSkin=false] - Whether weight less for yellow skin tone colors.
 */
ColorExtractor.prototype.getColor = function *_getColor(img, opts) {
  var count = opts.count || 10
  var shouldReduceBrightness = typeof opts.reduceBrightness === 'boolean' ? opts.reduceBrightness : true
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

  var colorData = yield resizeAndGetImageData(img)
  var pos, hex, hexObj = {}, hexArr
  var r, g, b
  var gradients = {}, brightness = {}
  var result = []

  for (pos in colorData) {
    hex = colorData[pos]
    r = parseInt(hex.substr(0, 2), 16)
    g = parseInt(hex.substr(2, 2), 16)
    b = parseInt(hex.substr(4, 2), 16)

    // Round the colors, to reduce the number of duplicate colors
    r = parseInt(((r + halfDelta) / delta), 10) * delta
    g = parseInt(((g + halfDelta) / delta), 10) * delta
    b = parseInt(((b + halfDelta) / delta), 10) * delta

    if (r > 255) r = 255
    if (g > 255) g = 255
    if (b > 255) b = 255

    hex = ('0' + r.toString(16)).substr(-2) +
      ('0' + g.toString(16)).substr(-2) +
      ('0' + b.toString(16)).substr(-2)

    if (hexObj[hex]) hexObj[hex]++
    else hexObj[hex] = 1
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

  if (shouldReduceBrightness) {
    hexArr = helper.keysAfterArsortNumeric(hexObj)
    hexArr.forEach(function(val) {
      if (!brightness[val]) {
        hex = shared.normalize(val, brightness, delta)
        brightness[val] = hex
      }
      else {
        hex = brightness[val]
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

var colorExtractor = new ColorExtractor()
module.exports = {
  getColor: co.wrap(colorExtractor.getColor)
}
