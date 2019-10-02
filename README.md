# patches
Adaptable emergency response dispatch software

## Installation & Usage
Clone the repository, run the build script, and create the database.

```bash
git clone https://github.com/ArtOfCode-/patches
cd patches
./build.sh
mysql -u root -p < database.sql
```

To run the server for **development**, I suggest using [nodemon](https://www.npmjs.com/package/nodemon), which is _not_ included as
a dependency in this project. You'll need to install it first with `npm i -g nodemon`, then run the server with:

```bash
DEBUG=app:* nodemon build/app.js
```

[npm-watch](https://www.npmjs.com/package/npm-watch) is also included in this project to let you build views and assets as you develop;
run `npm-watch` in a terminal before you start to make use of this.

To run the server for **production**, you can use simple Node, and turn much of the debug logging off:

```bash
DEBUG=app:base node build/app.js
```

## Contributing
Contributions are welcome. Please open an issue first so that I know what you're working on and can discuss it if necessary.

## License
[MIT](https://choosealicense.com/licenses/mit/)