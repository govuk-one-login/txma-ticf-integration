import esbuild from 'esbuild'
import { readFileSync } from 'fs'
import { join } from 'path'
import { yamlParse } from 'yaml-cfn'

interface IAwsResource {
  Type: string
}

interface ILambdaFunction extends IAwsResource {
  Properties: {
    Handler: string
  }
}

const handlerPath = 'src/lambdas'

const { Resources } = yamlParse(
  readFileSync(join(__dirname, 'template.yaml'), 'utf-8')
)

const awsResources = Object.values(Resources) as IAwsResource[]

const lambdas = awsResources.filter(
  (resource) => resource.Type === 'AWS::Serverless::Function'
) as ILambdaFunction[]

const entries = lambdas.reduce((entries, lambda) => {
  const handlerName = lambda.Properties.Handler.split('.')[0]
  const filepath = `./${handlerPath}/${handlerName}/handler.ts`

  entries[handlerName] = filepath
  return entries
}, {} as { [key: string]: string })

esbuild
  .build({
    bundle: true,
    entryPoints: entries,
    logLevel: 'info',
    minify: true,
    platform: 'node',
    outdir: 'dist',
    sourcesContent: false,
    sourcemap: 'inline',
    target: 'es2022'
  })
  .catch(() => process.exit(1))
