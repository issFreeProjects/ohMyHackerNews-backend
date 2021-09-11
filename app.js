require("dotenv").config();
require("./config/database").connect();
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("./model/user");
const NewsH = require("./model/newsHeader");
const NewsC = require("./model/newsContent");
const auth = require("./middleware/auth");

var newsCount = 0;

const app = express();
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

readnewsCount();
async function readnewsCount(){
  let last = await (NewsH.find().sort({$natural:-1}).limit(1));
  newsCount = (last[0]) ? last[0].counter : 0;
  console.log("Last news count: ", newsCount);
}

app.use(express.json({ limit: "50mb" }));

app.post("/", (req,res)=>{ res.send("it works:)")});

app.post("/register", async (req, res) => {
  try {
    // Get user input
    const { name, email, password } = req.body;

    // Validate user input
    if (!(email && password && name)) {
      res.status(400).send("All input is required");
    }else{
        // check if user already exist
        // Validate if user exist in our database
        const oldUser = await User.findOne({ email });

        if (oldUser) {
          return res.status(409).send("User Already Exist. Please Login");
        }

        //Encrypt user password
        encryptedPassword = await bcrypt.hash(password, 10);

        // Create user in our database
        const user = await User.create({
          name,
          email,
          password: encryptedPassword,
          newsId: [],
          token: null
        });

        // return new user
        res.status(201).json(user);
      }
  } catch (err) {
    console.log(err);
  }
});


app.post("/login", async (req, res) => {
  try {
    // Get user input
    const { email, password } = req.body;

    // Validate user input
    if (!(email && password)) {
      res.status(400).send("All input is required");
    }
    // Validate if user exist in our database
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      try{ 
        jwt.verify(user.token, process.env.TOKEN_KEY);
      } catch(err){ // token is not valid or expired
        const token = jwt.sign(
          { user_id: user._id, email },
          process.env.TOKEN_KEY,
          { expiresIn: "2h", }
        );
        // save user token
        user.token = token;
        user.save();
      }
      res.status(200).json(user);
    } else{ res.status(400).send("Invalid Credentials") }
  } catch (err) {
    console.log(err);
  }
});


app.post("/logout", auth, async (req,res)=>{
  const user = await User.findOne({ "email": req.user.email });
  if(user){
    user.token = '';
    user.save();
    res.status(200).send("loged out");
  }else res.status(200).send("user or token not exist or expired");
});


app.post("/like/show", async (req,res)=>{
  const { headerID } = req.body;
  const header = await NewsH.findOne({_id: headerID});
  res.json({"likes":header.likes});
});


app.post("/like/remove", auth, async (req,res)=>{
  const uid = req.user.user_id;
  const { headerID } = req.body;
  const header = await NewsH.findOne({_id: headerID});
  if(header){
      header.likes = header.likes.filter((el)=>{ return el != uid });
      header.save();
      res.status(201).send("like removed");
  } else res.send("header not fount");
});


app.post("/like/add", auth, async (req,res)=>{
  const uid = req.user.user_id;
  const { headerID } = req.body;
  const header = await NewsH.findOne({_id: headerID});
  if(header){
    if( header.likes.includes(uid) )
      res.status(201).send("alredy liked!");
    else {
      header.likes.push(uid);
      header.save();
      res.send("liked");
    }
  } else res.send("header not fount");
});


app.post("/getnewsH", (req,res)=>{
    const { mth, n } = req.body;
    const l=newsCount-(mth*n-n), b=newsCount-mth*n+1;
    NewsH.find({ counter: {$lte: l, $gte: b} }).sort({counter: -1}).then(data=>res.status(201).json(data));
});


app.post("/getnewsH2", (req,res)=>{
  const { id } = req.body;
  if( id )
    NewsH.find({ _id: id }).then(data=>res.status(201).json(data[0]))
  else res.status(400).send("id is required");
});


app.post("/getnewsC", async (req,res)=>{
  const { newsID } = req.body;
  const header = await NewsH.findOne({_id: newsID});
  const content = await NewsC.find({id: newsID});
  res.send({ 'header': header, 'content': content[0] });
});


app.post("/compose", auth, async (req,res)=>{
  // create new news
  const user = await User.findOne({email: req.user.email});
  const { title, content } = req.body;
  const date = Date();
  newsCount+=1;
  // make and save news header
  const header = await NewsH.create({ "author": user.name, date, "likes": [], title, "counter": newsCount });
  // make and save news content
  await NewsC.create({"id": header._id, "content": content});
  user.newsId.push(header._id);
  await user.save();
  res.json({"status":'ok', "id": header._id});
});


app.post("/myposts", auth, async (req,res)=>{
  const user = await User.findOne({email: req.user.email});
  if(user)
    res.json({"myposts": user.newsId});
  else res.json({"myposts": null});
});



// This should be the last route else any after it won't work
app.use("*", (req, res) => {
  res.status(404).json({
    success: "false",
    message: "Page not found",
    error: {
      statusCode: 404,
      message: "You reached a route that is not defined on this server",
    },
  });
});

module.exports = app;
