var ColorUtil = {
  hexToRgb: function(color) {
    if (color.indexOf('#') === 0) color = color.substring(1)

    if (color.length === 3) { //for shorthand like 9F0
      color = color.charAt(0) + color.charAt(0) + color.charAt(1) + color.charAt(1) + color.charAt(2) + color.charAt(2)
    }
    color = parseInt(color, 16)
    return { r: color >> 16, g: (color >> 8) & 255, b: color & 255 }
  },

  rgbToHsv: function(r, g, b) {
    r = r/255
    g = g/255
    b = b/255

    var max = Math.max(r, g, b), min = Math.min(r, g, b)
    var h, s, v = max
    var d = max - min
    s = max === 0 ? 0 : d / max

    if (max == min) {
      h = 0 // achromatic
    }
    else {
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0)
          break
        case g:
          h = (b - r) / d + 2
          break
        case b:
          h = (r - g) / d + 4
          break
      }

      h /= 6 // Range of this h value: [0, 1]
    }

    return { h: h * 360, s: s, v: v }
  },

  // If <2, use black text. Otherwise, white text.
  luminosityContrastWithWhite: function(r, g, b) {
    if (arguments.length === 1) {
      var rgb = ColorUtil.hexToRgb(r)
      r = rgb.r
      g = rgb.g
      b = rgb.b
    }

    var luminance = 0.2126 * Math.pow(r/255, 2.2) + 0.7152 * Math.pow(g/255, 2.2) + 0.0722 * Math.pow(b/255, 2.2)
    return 1.05 / (luminance + 0.05)
  }
}

if (typeof module !== 'undefined') module.exports = ColorUtil
