import { readFileSync } from 'fs'
import { join, resolve } from 'path'
import { Configuration } from 'webpack'
import { yamlParse } from 'yaml-cfn'

interface IAwsResource {
  Type: string
}

interface ILambdaFunction extends IAwsResource {
  Properties: {
    Handler: string
  }
}

const handlerPath = 'src/handlers'

const { Resources } = yamlParse(
  readFileSync(join(__dirname, 'template.yaml'), 'utf-8')
)

const awsResources = Object.values(Resources) as IAwsResource[]

const lambdas = awsResources.filter(
  (resource) => resource.Type === 'AWS::Serverless::Function'
) as ILambdaFunction[]

const entries = lambdas
  .map((lambda) => ({
    filename: lambda.Properties.Handler.split('.')[0]
  }))
  .reduce(
    (lambdas, lambda) =>
      Object.assign(lambdas, {
        [lambda.filename]: `./${handlerPath}/${lambda.filename}.ts`
      }),
    {}
  )

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
    path: resolve(__dirname, './dist')
  },
  resolve: {
    extensions: ['.js', '.ts']
  },
  target: 'node'
}

export default config
