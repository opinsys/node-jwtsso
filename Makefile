build:
	npm install --registry http://registry.npmjs.org

clean:
	rm -rf node_modules

dev-server:
	node example/app.js
