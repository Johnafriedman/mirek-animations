console.log('Starting server in ' + process.env.NODE_ENV + ' mode');

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static("bin/www"));

app.listen(port, ()=> {
    console.log(`Example app listening on port ${port}`)
});
