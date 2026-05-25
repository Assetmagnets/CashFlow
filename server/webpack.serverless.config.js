const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  entry: './src/serverless.ts',
  target: 'node',
  mode: 'production',
  // Do NOT externalize anything - bundle everything into one file
  // except for native modules and prisma (which need file system access)
  externals: [
    // Only externalize packages that MUST be loaded from node_modules at runtime
    '@prisma/client',
    '.prisma/client',
  ],
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
          },
        },
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    filename: 'serverless.js',
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'commonjs2',
  },
  optimization: {
    minimize: false, // Keep readable for debugging
  },
};
