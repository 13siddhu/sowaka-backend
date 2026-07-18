const http = require('http');
const app = require('./app');
const { initSocket } = require('./sockets');
const initJobs = require('./jobs');

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Initialize Cron Jobs
initJobs();

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
