var webpack = require('webpack');
var pluginHtml = require('html-webpack-plugin');
var pluginExtractText = require("extract-text-webpack-plugin");

var serverHost = '0.0.0.0';
var serverPort = 8888;
var __DEV__ = (process.env.NODE_ENV !== 'production');

module.exports = {
  devtool: __DEV__ ? 'eval-source-map' : 'eval',
  debug: __DEV__,
  context: __dirname + "/src",
  entry: {
    vendors: [
      'angular',
      'angular/angular-csp.css',
      'angular-material',
      'angular-material/angular-material.css',
      'angular-animate',
      'angular-sanitize',
      'angular-ui-router'
    ],
    // Entry "src/app.js"
    app: [
      './app.js'
    ]
  },
  output: {
    path: __dirname + "/dist",
    filename: "[name].[chunkhash].js",
    hash: true
  },
  node: {
    fs: "empty"
  },
  devServer: {
    contentBase: __dirname + '/dist',
    info: true,
    inline: true,
    colors: true,
    host: serverHost,
    port: serverPort
  },
  resolve: {
    extensions: ['', '.js'],
    modulesDirectories: [
      'node_modules',
      'src'
    ]
  },
  module: {
    loaders: [{
      test: /\.js$/,
      exclude: /node_modules/,
      loader: 'ng-annotate-loader'
    },{
      test: /\.css$/,
      loader: pluginExtractText.extract("style-loader", "css-loader")
    },{
      test: /\.(eot|woff|ttf|svg|woff2)$/,
      loader: "file-loader"
    },{
      test: /\.html$/,
      loader: "ng-cache-loader?prefix=src:**"
    },{
      test: /\.json$/,
      loader: "json-loader"
    },{
      test: /\.(jpe?g|png|gif|svg)$/i,
      loaders: [
          'file?hash=sha512&digest=hex&name=[name].[hash].[ext]',
          'image-webpack?bypassOnDebug&optimizationLevel=7&interlaced=false'
      ]
    }]
  },
  plugins:[
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendors',
      filename: 'vendors.[chunkhash].js',
      chunks: ['vendors']
    }),

    new pluginHtml({
      template: './index.ejs'
    }),

    new  pluginExtractText('[name].[chunkhash].css'),

    new webpack.optimize.DedupePlugin(),

    new webpack.optimize.OccurenceOrderPlugin(),

    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false,
      },
    })
  ]
};