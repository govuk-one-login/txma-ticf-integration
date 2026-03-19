import esbuild from 'esbuild'
import { mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { yamlParse } from 'yaml-cfn'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

interface IAwsResource {
  Type: string
}

interface ILambdaFunction extends IAwsResource {
  Properties: {
    CodeUri: string
  }
}

const lambdasPath = 'src/lambdas'

const { Resources } = yamlParse(
  readFileSync(join(__dirname, 'template.yaml'), 'utf-8')
)

const awsResources = Object.values(Resources) as IAwsResource[]

const lambdas = awsResources.filter(
  (resource) => resource.Type === 'AWS::Serverless::Function'
) as ILambdaFunction[]

const entries = lambdas.map((lambda) => {
  const lambdaName = lambda.Properties.CodeUri.split('/')[1]
  return `./${lambdasPath}/${lambdaName}/handler.ts`
})

esbuild
  .build({
    bundle: true,
    entryPoints: entries,
    logLevel: 'info',
    minify: true,
    platform: 'node',
    format: 'esm',
    outdir: 'dist',
    outbase: 'src/lambdas',
    sourcesContent: false,
    sourcemap: 'inline',
    target: 'ES2024',
    banner: {
      js: "import { createRequire } from 'module';const require = createRequire(import.meta.url);import { fileURLToPath } from 'url';import { dirname } from 'path';const __filename = fileURLToPath(import.meta.url);const __dirname = dirname(__filename);"
    }
  })
  .then(() => {
    // Create package.json with type: module for each Lambda function
    lambdas.forEach((lambda) => {
      const lambdaName = lambda.Properties.CodeUri.split('/')[1]
      const lambdaDistPath = join(__dirname, 'dist', lambdaName)

      mkdirSync(lambdaDistPath, { recursive: true })

      const packageJson = {
        type: 'module'
      }

      writeFileSync(
        join(lambdaDistPath, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      )
    })
  })
  .catch(() => process.exit(1))
