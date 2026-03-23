const path = require('path');
// Change working directory to backend so server logic (like '../frontend/dist') stays correct
process.chdir(path.join(__dirname, 'backend'));
require('./server.js');
