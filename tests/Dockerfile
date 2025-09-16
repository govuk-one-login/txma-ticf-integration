ARG ALPINE_VERSION_NODE=3.21
ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION_NODE} AS run-tests

# use opencontainer annotations https://github.com/opencontainers/image-spec/blob/main/annotations.md
ARG GIT_COMMIT=unspecified
LABEL org.opencontainers.image.revision=$GIT_COMMIT

RUN apk update && \
      apk upgrade && \
      apk add --no-cache \
      bash \
      aws-cli \
      mandoc \
      curl

WORKDIR /test-app

COPY package.json package-lock.json tsconfig.json ./
COPY tests ./tests
COPY tests/run-tests.sh /

RUN npm ci
RUN chmod +x /run-tests.sh

WORKDIR /test-app/tests

ENTRYPOINT ["/run-tests.sh"]