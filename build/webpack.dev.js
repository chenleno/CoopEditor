const path = require('path');
const webpack = require('webpack')
const webpackConfig = require('./webpack.config')
const { merge } = require('webpack-merge')

module.exports = merge(webpackConfig('development'), {
  mode: 'development',
  devServer: {
    contentBase: path.join(__dirname, './dist/'),
    compress: true,
    // publicPath: '/dist/'
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin()
  ]
})

