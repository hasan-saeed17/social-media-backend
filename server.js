const express = require('express');
const app = express();
const port = 4000;
const db=require('./db.js');
const bodyParser=require("body-parser");
app.use(bodyParser.json());
app.use('/uploads', express.static('uploads'));

const userRoutes = require('./routes/userRoute');


app.use('/api/users', userRoutes);

app.listen(port,()=>{
    console.log("server is running")
})

app.get('/',(req,res)=>{
    res.send("server accessed.")
})