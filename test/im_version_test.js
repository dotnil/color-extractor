var fs = require('fs')
var path = require('path')
var co = require('co')

var ColorExtractor = require('../color-extractor-im')

var imagePaths = []

for (var i = 1; i <= 74; i++) {
  imagePaths.push(('0' + i).substr(-2))
}

imagePaths = imagePaths.map(function(sequence) {
  return path.join(__dirname, 'img', sequence + '.jpg')
})

function writeFile(contents, filePath) {
  return new Promise(function(resolve, reject) {
    fs.writeFile(filePath, contents, function(err) {
      if (err) reject(err)
      else resolve()
    })
  })
}

co(function *() {
  var results = []
  var colorExtractor = new ColorExtractor()
  var result

  for (var i = 0; i < imagePaths.length; i++) {
    result = yield colorExtractor.getColor(imagePaths[i], {
      delta: 17,
      neglectYellowSkin: true,
      favorSaturated: true
    })
    results.push(result)
  }

  yield writeFile('window.imTestResult=' + JSON.stringify(results), path.join(__dirname, 'im_result.js'))
})
.then(function() {
  process.exit(0)
})
.catch(function(err) {
  console.error(err)
})