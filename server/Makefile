IMAGE = mdip-0.1
CONTAINER = Accessport2LtpTranslator-0.1
SERVER_PORT = 4003
PORT = 4003
#DOCKER_HOST = linkvis-ci-01

# Build docker image
image:
	npm install
	docker build -t $(IMAGE) --label com.docker.compose.project="sdn" .

# Stop docker container
stop:
	docker stop $(CONTAINER)

# Remove docker container
rm:
	docker rm -f $(CONTAINER)

# Remove docker container and image
clean: rm
	rm -f package-lock.json
	rm -Rf node_modules
	docker rmi $(IMAGE)

# Run docker container
run: rm
	docker run -d -p $(PORT):$(SERVER_PORT) --restart always --name $(CONTAINER) $(IMAGE)

test: run
	npm run test
	newman run ../testing/Accessport2LtpTranslator.postman_collection.json --env-var baseUrl=http://$(DOCKER_HOST):$(PORT)

test-local: run
	npm run test
	newman run ../testing/Accessport2LtpTranslator.postman_collection.json --env-var baseUrl=http://localhost:$(PORT)
