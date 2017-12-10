const nodeExternals = require('webpack-node-externals');
const path = require('path');

const cwd = process.cwd();

const WATCH = (process.env.NODE_ENV === 'development');

module.exports = {
  target: 'node',
  devtool: 'source-map',
  watch: WATCH,
  entry: {
    swagger_router: [
      'babel-polyfill',
      path.join(cwd, 'src/api/fittings/swagger_router'),
    ],
  },
  resolve: {
    modules: [
      path.join(cwd, 'node_modules'),
    ],
    alias: {
      configuration: path.join(cwd, 'config'),
      server: path.join(cwd, 'src'),
    },
    extensions: ['.json', '.js', '.min.js'],
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: 'babel-loader',
        exclude: /node_modules/,
      },
    ],
    noParse: /\.min\.js/,
  },
  externals: [nodeExternals()],
  output: {
    filename: '[name].js',
    libraryTarget: 'commonjs2',
    path: path.join(cwd, 'assets/fittings'),
  },
};
