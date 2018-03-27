import * as path from 'path';
import * as fs from 'fs';
import * as HtmlWebpackPlugin from 'html-webpack-plugin';
import * as webpack from 'webpack';
var ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

var genericPlugins = [
  new ForkTsCheckerWebpackPlugin({
    checkSyntacticErrors: true
  })
];

function generateConfig(plugins = genericPlugins): webpack.Configuration {
  return {
    mode: "development",
    context: path.resolve('.'),
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: [
            { loader: 'cache-loader' },
            {
              loader: 'thread-loader',
              options: {
                works: require('os').cpus().length - 1
              }
            },
            {
              loader: 'ts-loader',
              options: {
                happyPackMode: true
              }
            }
          ]
        }, {
          test: /\.css$/,
          loader: 'style-loader!css-loader',
          exclude: path.resolve(__dirname, "node_modules")
        }
      ]
    },
    devServer: {
      inline: true,
      hot: true,
      port: 8080
    },
    devtool: "source-map",
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.css']
    },
    node: {__dirname: false},
    plugins: plugins
  }
}

function generateRendererConfig(plugins = genericPlugins) {
  return {
    ...generateConfig(plugins),
    target: 'electron-renderer',
    externals: [
      (function () {
        var IGNORES = [
          'electron'
        ];
        return function (_context: any, request: string, callback: any) {
          if (IGNORES.indexOf(request) >= 0) {
            return callback(null, "require('" + request + "')");
          }
          return callback();
        };
      })()
    ]
  };
}

const commonOutput: webpack.Output = {
  filename: '[name].js',
  devtoolModuleFilenameTemplate: function(info) {
    return "../" + info.resourcePath;
  }
};

module.exports = [
  {
    ...generateConfig(),
    target: 'electron-main',
    entry: ['./server/server'],
    output: {
      ...commonOutput,
      path: path.resolve(__dirname, "build"),
      publicPath: '/'
    },
    externals: fs.readdirSync("node_modules").map((mod) => "commonjs " + mod)
  },
  {
    ...generateRendererConfig([
      new HtmlWebpackPlugin({
        title: 'Electro Pip',
        filename: 'pip.html'
      })
    ].concat(genericPlugins)),
    entry: ['./pip/pip'],
    output: {
      ...commonOutput,
      path: path.resolve(__dirname, "build/pip"),
      publicPath: '/pip/'
    }
  }
];
