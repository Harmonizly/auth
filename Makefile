CC = yarn
NODE_ENV?=development

.PHONY: clean all test

all:
	$(MAKE) clean
	$(MAKE) server

clean:
	rm -rf assets

server:
	$(CC) run webpack --config ./config/webpack/webpack.config.js

docker:
	docker build -t harmonize/harmonize:latest --build-arg NODE_ENV=$(NODE_ENV) .
