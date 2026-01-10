const express = require('express')
const app = express()
const port = 3500


app.listen(port,()=>{
    console.log("server is running")
})

app.get('/',(req,res)=>{
    res.send("server accessed.")
})