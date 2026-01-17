const mongoose = require('mongoose')

const postSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    type: {type:String, enum:["sports","political","fashion","business","technology","health"], required:true},
    
    contentType: {type:String, enum:["image","text"], required:true},
    content: {type:String, required:true},

    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref:"User"
    }],
}, 
{ 
    collection: "posts", 
    timestamps: {
        createdAt: "datePosted",
        updatedAt: "dateUpdated"
    } 
});

const Post = mongoose.model("Post", postSchema);
module.exports = Post;