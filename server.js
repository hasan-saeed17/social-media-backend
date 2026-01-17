const express = require('express');
const app = express();
const port = 4000;
const db = require('./db.js');
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const commentRoute = require('./routes/commentRoute.js')

app.use(cookieParser());
app.use(bodyParser.json());
app.use('/uploads', express.static('uploads'));

const userRoutes = require('./routes/userRoute');


app.use('/api/users', userRoutes);
app.use("/comment", commentRoute);
app.listen(port, () => {
    console.log(`Express Server is up and running on port ${port}`)
})

app.get('/', (req, res) => {
    res.send("server accessed.")
})