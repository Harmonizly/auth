FROM bcwebb88/nodejs-ami:latest

ARG NODE_ENV

ENV NODE_ENV=${NODE_ENV:-development}

COPY . /usr/local/src/harmonize
WORKDIR /usr/local/src/harmonize

RUN yarn install
RUN make all

EXPOSE 80
EXPOSE 9615

ENTRYPOINT ["yarn", "start"]
