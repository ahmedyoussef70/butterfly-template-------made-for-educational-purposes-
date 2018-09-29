var join = require('path').join
var include = join(__dirname, 'src')
module.exports = {
  entry: './src/index',
  output: {
    path: join(__dirname, 'umd'),
    libraryTarget: 'umd',
    library: 'butterflyTemplate'
  },
  module: {
    rules: [{ test: /\.js$/, loader: 'babel-loader', include }]
  }
}
