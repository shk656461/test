const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const path = require('path');

module.exports = {
  entry: path.resolve(__dirname, './src/index.js'),
  output: {
    path: __dirname + '/dist',
    filename: 'bundle.js'
  },  
  module: {
    rules: [
      {
        test: /\.js$/,
        use: ["babel-loader"]
      }      
    ]
  },
  devServer: {
    contentBase: './public',
    open: true,
    before(app) {
      // use proper mime-type for wasm files
      app.get('*.wasm', function (req, res, next) {
        var options = {
          root: path.join(__dirname, 'src'),
          dotfiles: 'deny',
          headers: {
            'Content-Type': 'application/wasm'
          }
        };
        res.sendFile(req.url, options, function (err) { if (err) { next(err); }});
      });
    }
  },    

  plugins: [
    new HtmlWebpackPlugin({
      title: "Super Pack",
      h1: "Head",
      template: "src/index.html"
    }),
    new CopyPlugin({
      patterns: [
        { from: "public"},
        { from: "src/align_data.js" },
        { from: "src/align_data.wasm" }
      ],
    }),    
  ],
};