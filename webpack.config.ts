import path from 'path'
import { Configuration } from 'webpack'

//TODO: We could parse the template file and find these entry points. This would save writing them in 2 places.
const entries = {
  helloWorld: './src/handlers/hello-world.ts'
}

const config: Configuration = {
  entry: entries,
  devtool: 'source-map',
  mode: process.env.NODE_ENV === 'dev' ? 'development' : 'production',
  module: {
    rules: [{ test: /\.ts$/, use: 'ts-loader', exclude: /node_modules/ }]
  },
  output: {
    clean: true,
    filename: '[name].js',
    library: {
      type: 'commonjs2'
    },
    path: path.resolve(__dirname, './dist')
  },
  resolve: {
    extensions: ['.js', '.ts']
  },
  target: 'node'
}

export default config
