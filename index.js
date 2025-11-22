const App = require('./App.js');
const app = new App();
try {
    app.startServer();
} catch (err) {
    console.error(err);
}

module.exports = app.server;