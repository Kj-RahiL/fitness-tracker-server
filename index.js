const express = require('express');
require('dotenv').config()
const app = express()
const cors = require('cors');

const port = process.env.PORT || 5000;
// middleware
app.use(express.json())
app.use(cors())

app.get('/', (req, res) => {
    res.send('Fitness Tracker is now Fighting......')
  })
  app.listen(port, () => {
    console.log(`Fitness tracker server is running on the port :${port}`)
  })