ARG node_version=22.16-alpine3.20

FROM node:${node_version} AS base

RUN mkdir /opt/epp
# this expects a volume to be mounted to /opt/epp
WORKDIR /opt/epp

FROM base AS build
COPY package.json package.json
COPY yarn.lock yarn.lock
COPY .yarnrc.yml .yarnrc.yml
COPY .yarn/releases .yarn/releases
COPY tsconfig.json tsconfig.json

RUN yarn install

FROM base AS prod

COPY --from=build /opt/epp/node_modules node_modules
COPY --from=build /opt/epp/yarn.lock yarn.lock
COPY --from=build /opt/epp/tsconfig.json tsconfig.json
COPY package.json package.json
COPY src/ src/

EXPOSE 3000
CMD [ "yarn", "start" ]

FROM prod AS dev
CMD [ "yarn", "start:dev" ]
