const express = require('express');
const app = express();
app.use(express.static('../project'));

app.listen(3000);