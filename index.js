import App from './App.js';
const app = new App();
try {
    app.startServer();
} catch (err) {
    console.error(err);
}

export default app.server;