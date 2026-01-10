const mongoose=require("mongoose")

const mongoURL='mongodb://localhost:27017/Social-Media-Platform';

mongoose.connect(mongoURL);

const db=mongoose.connection;

db.on('connected', ()=>{console.log("Db is connected")})
db.on('disconnected', ()=>{console.log("DB is disconnected")})
db.on('error', (error)=>{console.log("Error occurred"+error)})

module.exports=db;