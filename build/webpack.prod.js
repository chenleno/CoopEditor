const path = require('path');
const { merge } = require('webpack-merge')
const webpackConfig = require('./webpack.config')


module.exports = merge(webpackConfig('production'), {
  mode: 'production',
  // devtool: 'cheap-module-source-map',
})
