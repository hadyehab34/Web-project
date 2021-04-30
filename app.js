//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
// const _ = require("lodash");
var session = require('express-session');

const app = express();

app.use(session({secret: 'mySecret', resave: false, saveUninitialized: true, cookie: {}}));
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));


mongoose.connect("mongodb://localhost:27017/usersDB",{
  useNewUrlParser: true,
  useUnifiedTopology: true
});


const userSchema = mongoose.Schema({
  name: String,
  email: String,
  password: String,
  gender: String,
  job: String,
  address: String,
  profilePicture: String,
  friends: [],
  friendsRequests: [],
  posts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  }]
});

const postSchema = {
  caption: String,
  image: String,
  postedTime: {
    type: Date,
    default: Date.now
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
};

const User = mongoose.model("User", userSchema);

const Post = mongoose.model("Post", postSchema);


app.get("/", function(req, res) {
  res.render("start");
});

app.get("/signup", function(req, res) {
  res.render("signup");
});

app.get("/login", function(req, res) {
  res.render("login");
});

app.get("/profile", function(req, res) {
  const user = req.session.user;

  Post.find({}, function(err, posts){
    if (err) {console.log(err);}
    else {
      User.find({}, function(err, users){
        if (err) {console.log(err);}
        else {
          res.render("profile", {
            posts: posts,
            users: users,
            name: user.name,
            address: user.address,
            pic: user.profilePicture,
            job: user.job,
            email: user.email,
            id: user._id
           });
      }
      });
    }
  });
});

app.get("/home", function(req, res) {

  Post.find({}, function(err, posts){
    if (err) {console.log(err);}
    else {
      User.find({}, function(err, users){
        if (err) {console.log(err);}
        else {
          res.render("home", {posts: posts, users: users});
      }
      });
    }
  });
});


app.post("/signup", function(req, res) {
  const newUser = new User({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    gender: req.body.gender,
    profilePicture: req.body.pic,
    job: req.body.job,
    address: req.body.address
  });

  User.findOne({email: newUser.email}, function(err, found) {
    if (err) {
      console.log(err);
    } else {
      if (found) {
        res.render("signup");
      } else {
        newUser.save(function(err) {
          if (err) {
            console.log(err);
          } else {
            req.session.user= newUser; //or whatever
            res.render("profile", {
              name: newUser.name,
              address: newUser.address,
              pic: newUser.profilePicture,
              job: newUser.job,
              email: newUser.email
            });
          }
        });
      }
    }
  });

});

app.post("/login", function(req, res) {

  const username = req.body.username;
  const password = req.body.password;

  User.findOne({email: username }, function(err, found) {
    if (err) {
      console.log(err);
    } else {
      if (found) {
        req.session.user = found;
        if (found.password === password) {
          res.redirect("/profile");
           //or whatev
        }
      }
    }
  });
});

app.post("/profile", (req, res) => {

  const user = req.session.user;

  const newPost = new Post({
    caption: req.body.caption,
    image: req.body.image,
    postedBy: user._id
  });
  newPost.save((err) => {
    if (err) {
      console.log(err);
    } else {
      Post.find({})
      .populate("postedBy")
      .exec();

      User.updateOne({name: user.name}, {$push: {posts: newPost.id}}, function(err){
        User.find({})
        .populate("posts")
        .exec();
      });
    }
  });
});




app.listen(3000, function() {
  console.log("Server started on port 3000");
});
