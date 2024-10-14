# TICF Zendesk integration with TxMA

- [TICF Zendesk integration with TxMA](#ticf-zendesk-integration-with-txma)
- [Pre-requisites](#pre-requisites)
  - [Important](#important)
- [Getting started](#getting-started)
- [Testing](#testing)
  - [Setup](#setup)
  - [Running the Integration Tests](#running-the-integration-tests)
  - [Running feature tests against a feature branch in the Dev environment](#running-feature-tests-against-a-feature-branch-in-the-dev-environment)
  - [Test Reports](#test-reports)
  - [Creating and approving a Zendesk ticket](#creating-and-approving-a-zendesk-ticket)
  - [Running Zendesk webhook locally](#running-zendesk-webhook-locally)
- [Code standards](#code-standards)
- [Scripts](#scripts)
  - [Valid email recipients management](#valid-email-recipients-management)
  - [Licence](#licence)

This repository allows for Zendesk integration with Transaction Monitoring and Auditing (TxMA) which is part of the Digital Identity (DI) system. Events from Zendesk will be able to trigger an automated process to begin the extraction of Audit data from S3.

Threat Intelligence and Counter Fraud (TICF) analysts will be able to request audit data that is stored in S3 via Zendesk tickets. This will trigger an automated process to copy the data to another S3 bucket where Athena queries can be run. The requester is then notified when the query has finished and their results are available via a pre-signed URL in another S3 bucket. The integration with Zendesk also means that tickets can be updated throughout the automated process.

# Pre-requisites

To run this project you will need the following:

- [SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html) - Used to build and deploy the application
- [Node.js](https://nodejs.org/en/) version 18 - Recommended way to install is via [NVM](https://github.com/nvm-sh/nvm)
- [Docker](https://docs.docker.com/get-docker/) - Required to run SAM locally
- [Yarn](https://yarnpkg.com/getting-started/install) version 3 - The package manager for the project
- [Checkov](https://www.checkov.io/) - Scans cloud infrastructure configurations to find misconfigurations before they're deployed. Added as a Husky pre-commit hook.

## Important

- **Node version 18** is required since the runtimes for Lambda functions are fixed.
- Remove any old versions of Yarn that you may have installed globally if installing via `corepack enable`, or else the global version will override the version coming from Node.

# Getting started

The project is using [Yarn Zero Installs](https://yarnpkg.com/features/zero-installs). So as long as Yarn itself is installed, everything should be ready to go out of the box. As long as you are running Node v16.10+, the easiest way to install Yarn is to enable corepack.

```shell
corepack enable
```

Then the only other thing that needs to be enabled is the Husky hooks.

```shell
yarn husky install
```

Zero installs works because the dependencies are committed via the `.yarn` folder. These are all compressed, so the folder size is much smaller than `node_modules` would be.

In order to ensure that dependencies cannot be altered by anything other than Yarn itself, we run `yarn install --check-cache` in the pipeline. This avoids the possibility of malicous users altering any dependency code.

# Testing

## Setup

The tests can be run against any of the following environments:

- dev
- build
- staging

The variables required to run the test are stored in AWS in the following places:

- SSM
- Secrets Manager
- Stack Outputs

Any variables can be overriden by setting them as environment variables when running the tests:

Overriding the `STACK_NAME` parameter, which is set in the config files (`tests/integration-tests/jest.integtation.config.ts` and `tests/e2e-tests/jest.e2e.config.ts`), will allow you to point at a dev stack with different stack outputs. SSM parameters and Secrets defined in other stacks will remain unchanged. However, these can be overriden using environmet variables if they need to change.

Note: For the dev environment some Secrets or SSM Parameters may be missing since there is no main stack.

If you want to use a particular fixed date for your data request, set the environment variable `FIXED_DATA_REQUEST_DATE`.

Additionally, the tests can be run by getting all of their values from a local file. To do this, create a `.env` file in the `tests/e2e-tests` or `tests/integration-tests` folders. There is an example `.env.template` file in the `tests/e2e-tests` folder that can be copied, but sensitive values will need to be filled in.

If you are unsure of any values ask the tech lead/dev team.

## Running the Integration Tests

To run tests against the environment you will need to be authenticated against the environment you wish to run the tests.

To run the integraton pack which pulls variables from AWS and assumes external services are stubbed you should assume a build account role and run the following:

```shell
yarn test:integration
```

To run the end to end pack which pulls variables from AWS and interacts with real external services you should assume a staging account role and run the following:

```shell
yarn test:e2e
```

To run an individual test (suite or test case):

```shell
yarn test:integration -t '<description_of_the_testcase_or_suite>'
```

To run an individual test file:

```shell
yarn test:integration /path/to/file.spec.ts
```

To override certain variables run:

```shell
STACK_NAME=<ANOTHER_STACK> ZENDESK_WEBHOOK_SECRET_KEY=<ANOTHER_SECRET> yarn test:integration
```

If you wish to run the tests with locally defined variables instead of pulling them from AWS, create a `test/integration-tests/.env` or `test/e2e-tests/.env` file and run:

```shell
yarn test:integration:dev
```

or

```shell
yarn test:e2e:dev
```

## Running feature tests against a feature branch in the Dev environment

1. Ensure you've got the environment variable STACK_NAME set by running `export STACK_NAME='{STACK_NAME}'` with your CloudFormation stack name.
2. Run the following to set up the secrets under `tests/{STACK_NAME}`

   ```bash
   yarn setupDevStackSecrets
   ```

3. Then run the test themselves
   ```bash
   yarn test:integration
   ```

## Test Reports

Running the tests creates a results file in JUnit format at `tests/reports/results`.

## Creating and approving a Zendesk ticket

Obviously, you can use the Zendesk UI to do this, but it can be a bit clunky to do this manually, especially if you need to repeat the process a few times.
There is therefore a script built-in to our `package.json` that you can run, as follows

Firstly, you'll need to set some environment variables in your shell (e.g. in your `.zshrc`). They cross over with those in `.integration.test.env`, but you don't need as many. Set the following

```
export ZENDESK_API_KEY='(check with Test team/Tech lead)'
export ZENDESK_BASE_URL='(value in Team Test Confluence)'
export ZENDESK_END_USER_EMAIL='(value in Team Test Confluence)'
export ZENDESK_AGENT_EMAIL='(value in Team Test Confluence)'
export ZENDESK_ADMIN_EMAIL='(value in Team Test Confluence)'
```

You then run

```
yarn createTestTicket <recipient email address> <data date, e.g. 2022-09-01> "<Subject line for ticket>" "<space-separated event ids e.g. c9e2bf44-b95e-4f9a-81c4-cf02d42c1552>" "<space-separated data paths, e.g. restricted.address>"
```

and the utility will create and approve a Zendesk ticket for you.

## Running Zendesk webhook locally

1. `yarn build` - This will make a build of the code which the SAM template refers to
2. `sam local start-api 2>&1 | tr "\r" "\n"` - This will start the api, formatting the log output so we can read multi-line logs (without this we don't see anything beyond the first line)
3. `curl -X post http://localhost:3000/zendesk-webhook` - This will confirm the request hitting the endpoint

# Code standards

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

# Scripts

All scripts can now be ran using `yarn cli` in the terminal. Use `yarn cli --help` to see what scripts are available and how to use them. You can also run `yarn cli <command> --help` to view detailed help per command

`script/cli.ts` is the entrypoint to the cli, each command listed by `yarn cli --help` will be implemented under `scripts/{command}/`. each command should have detailed guidance in `--help` on what the command does and details on the mandatory **arguments** and the **optional** options that can be provided to the CLI.

> [!NOTE]  
> Not all scripts have been migrated over. The following scripts can be used
>
> - Sending results of raw audit data
> - retrieving raw audit data from glacier and/or double encryption

## Valid email recipients management

The Scaled Audit Log system includes a step that checks if the email address of the user requesting data is in a preset list, which we manage via a file in an S3 bucket. To manage the contents of this file, we have a yarn script.

To run this script, you need to be logged in to the relevant `audit` account on the command line (e.g. with `aws sso login --profile=audit-{environment}`).

To show the current list:

```
yarn validRecipientsManager --env <environment name> --showCurrent
```

To add a new email to the list:

```
yarn validRecipientsManager --env <environment name> --addEmail <userEmail>
```

To remove an email from the list:

```
yarn validRecipientsManager --env production --removeEmail <userEmail>
```

## Licence

[MIT License](LICENCE)
