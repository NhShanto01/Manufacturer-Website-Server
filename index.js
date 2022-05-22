const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());





app.get('/', (req, res) => {
    res.send('Hello From prot 5000!')
});

app.listen(port, () => {
    console.log(`App listening on port ${port}`)
});