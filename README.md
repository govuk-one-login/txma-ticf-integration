# TICF Zendesk integration with TxMA

This repository allows for Zendesk integration with Transaction Monitoring and Auditing (TxMA) which is part of the Digital Identity (DI) system. Events from Zendesk will be able to trigger an automated process to begin the extraction of Audit data from S3.

Threat Intelligence and Counter Fraud (TICF) analysts will be able to request audit data that is stored in S3 via Zendesk tickets. This will trigger an automated process to copy the data to another S3 bucket where Athena queries can be run. The requester is then notified when the query has finished and their results are available via a pre-signed URL in another S3 bucket. The integration with Zendesk also means that tickets can be updated throughout the automated process.

## Pre-requisites

To run this project you will need the following:

- [SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html) - Used to build and deploy the application
- [Node.js](https://nodejs.org/en/) version 16 - Recommended way to install is via [NVM](https://github.com/nvm-sh/nvm)
- [Docker](https://docs.docker.com/get-docker/) - Required to run SAM locally
- [Yarn](https://yarnpkg.com/getting-started/install) version 3 - The package manager for the project
- [Checkov](https://www.checkov.io/) - Scans cloud infrastructure configurations to find misconfigurations before they're deployed. Added as a Husky pre-commit hook.

### Important

- **Node version 16** is required since the runtimes for Lambda functions are fixed.
- Remove any old versions of Yarn that you may have installed globally if installing via `corepack enable`, or else the global version will override the version coming from Node.

## Getting started

The project is using [Yarn Zero Installs](https://yarnpkg.com/features/zero-installs). So as long as Yarn itself is installed, everything should be ready to go out of the box. As long as you are running Node v16.10+, the easiest way to install Yarn is to enable corepack.

```
corepack enable
```

Then the only other thing that needs to be enabled is the Husky hooks.

```
yarn husky install
```

Zero installs works because the dependencies are committed via the `.yarn` folder. These are all compressed, so the folder size is much smaller than `node_modules` would be.

In order to ensure that dependencies cannot be altered by anything other than Yarn itself, we run `yarn install --check-cache` in the pipeline. This avoids the possibility of malicous users altering any dependency code.

### Test setup

To be able to run the integration tests, an environment file is needed at the root of the project. This should be named `.integration.test.env` and have the following entries (the values should be retrieved as indicated in the placeholders):

```
process.env.ZENDESK_TEST_API_TOKEN='(check with Test team/Tech lead)'
process.env.AWS_BASE_URL = '(check on Zendesk)'
process.env.ZENDESK_END_USERNAME = '(value in Team Test Confluence)'
process.env.ZENDESK_AGENT_USERNAME = '(value in Team Test Confluence)'

```

## Running Zendesk webhook locally

1. `yarn build` - This will make a build of the code which the SAM template refers to
2. `sam local start-api 2>&1 | tr "\r" "\n"` - This will start the api, formatting the log output so we can read multi-line logs (without this we don't see anything beyond the first line)
3. `curl -X post http://localhost:3000/zendesk-webhook` - This will confirm the request hitting the endpoint

## Code standards

This repository is set up to use [Prettier](https://prettier.io/) for formatting, and [ESLint](https://eslint.org/) to look for problems in any Typescript and Javascript code.

Prettier is an opinionated formatting tool for multiple languages/file formats. Exceptions can be added to the `.prettierrc.json` file.

ESLint is configured to use just its recommended rules via the `.eslintrc.json` file. These can be viewed at:

- [Javscript](https://eslint.org/docs/latest/rules/)
- [Typescript](https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/src/configs/eslint-recommended.ts)

Additionally, its code formatting rules are disabled as these are handled by Prettier.

To run the linting:

```
yarn lint
```

## Licence

[MIT License](LICENCE)
