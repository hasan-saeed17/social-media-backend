const express = require('express');
const app = express();
const port = 3500;
const db = require('./db.js');
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

app.use(cookieParser());
app.use(bodyParser.json());
app.use('/uploads', express.static('uploads'));

const userRoutes = require('./routes/userRoute');
const commentRoute = require('./routes/commentRoute.js')
const postRoutes = require('./routes/postRoutes')



app.use('/api/users', userRoutes);
app.use("/api/comment", commentRoute);
app.use('/api/posts', postRoutes)


app.listen(port, () => {
    console.log(`Express Server is up and running on port ${port}`)
})

app.get('/', (req, res) => {
    res.send("server accessed.")
})