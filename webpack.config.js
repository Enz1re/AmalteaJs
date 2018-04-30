var webpack = require('webpack');
var path = require('path');
var uglifyJsWebpackPlugin = require('uglifyjs-webpack-plugin')


module.exports = {
	devtool: 'source-map',
	entry: './amaltea.js',
	output: {
		filename: 'dist/bundle.js'
	},
	resolve: {
		extensions: ['.js']
	},
	plugins: [
		new uglifyJsWebpackPlugin({
			sourceMap: true,
			uglifyOptions: {
				output: {
					comments: false,
					beautify: false
				}
			}
		})
	]
}