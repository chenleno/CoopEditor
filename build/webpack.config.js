const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = env => {
  const DEV_MODE = env === 'development'
  return {
    entry: {
      index: './src/index.js'
    },
    output: {
      // globalObject: 'self',
      path: path.resolve(__dirname, '../dist/'),
      filename: '[name].bundle.[fullhash:8].js',
      // publicPath: '/dist/'
    },
    module: {
      noParse: /lodash/,
      rules: [
        {
          test: /\.css$/,
          use: [ 'style-loader', 'css-loader',]
        },
        {
          test: /\.js$/,
            loader: 'babel-loader',
            exclude: /node_modules/
        }
      ]
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '../src/')
      },
      extensions: ['.js'] // 自动解析确定的扩展，导入文件时可以不带扩展
    },
    plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
			filename: 'index.html',
			template: './src/index.html',
		})
    ]
  }
}
