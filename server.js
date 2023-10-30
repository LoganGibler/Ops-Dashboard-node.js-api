const { Client } = require("pg");
const express = require("express");
const mongoose = require("mongoose");
const app = express();
const cors = require("cors");
require("dotenv").config();
const jwtsecret = process.env.JWT_SECRET;
const bcrypt = require("bcrypt");
const client = new Client(process.env.DATABASE_URL);
const jwt = require("jsonwebtoken");
const morgan = require("morgan");

app.enable("trust proxy");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(cors());

const Users = require("./Schemas/userModel");
const Turnover = require("./Schemas/turnoverModel");

// middleware
async function authenticateToken(req, res, next) {
  const token = req.headers["authorization"];
  const username = req.body.username;
  console.log(token);

  if (token == null) {
    return res.sendStatus(401);
  }
  console.log("parsed token: ", JSON.parse(token));
  jwt.verify(JSON.parse(token), process.env.JWT_SECRET, async (err, user) => {
    if (err) {
      console.log(err);
      return res.sendStatus(403);
    }
    req.user = user;
    console.log("user:", user.username);
    console.log("username:", username);
    if (user.username !== username) {
      return res.sendStatus(405);
    }
    next();
  });
}

app.post("/protected", authenticateToken, async (req, res) => {
  // This route is protected and can only be accessed by authenticated users.
  res.send("You are authenticated");
});

// routes

app.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    const salt = await bcrypt.genSalt();
    const userCheck = await Users.findOne({ username });
    if (userCheck) {
      return res.status(400).json({ message: "Username already exists." });
    }

    const hashedPassword = bcrypt.hashSync(password, salt);
    console.log("Registered generated password:", hashedPassword);
    console.log("This is the username:", username);
    console.log("This is the password:", hashedPassword);
    const user = await Users.create({
      username: username,
      password: hashedPassword,
    });
    console.log("Registered user:", user);
    res.status(200).json({ message: "User created successfully", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/login", async (req, res) => {
  let { username, password } = req.body;
  console.log("username:", username);
  console.log("password: ", password);
  try {
    const user = await Users.findOne({ username: req.body.username });

    console.log("found user: ", user);

    if (!user) {
      return res.status(402).json({ message: "Invalid credentials." });
    }

    bcrypt.compare(password, user.password, (err, result) => {
      if (err) {
        return res.status(403).json({ message: "Invalid credentials." });
      }
      if (result) {
        const token = jwt.sign({ username }, jwtsecret, {
          expiresIn: "12h",
        });
        return res.status(200).json({ message: "Login successful", token });
      }
      return res.status(404).json({ message: "Invalid credentials." });
    });
  } catch (error) {
    res.status(500).json({ message: "Login has failed." });
  }
});

// content
app.get("/turnover", authenticateToken, async (req, res) => {
  try {
    const turnover = await Turnover.find({});
    res.status(200).json({ turnover });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/updateTurnover", authenticateToken, async (req, res) => {
  try {
    const { newTurnover, date, username } = req.body;
    const update = { turnover: newTurnover, date: date, username: username };
    const filter = { unchanged: true };
    const updatedTurnover = await Turnover.updateOne(filter, update, {
      upsert: true,
    });
    res.status(200).json({ message: "Turnover updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

mongoose
  .connect(process.env.DATABASE_URL)
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log("connected to mongodb");
    });
  })
  .catch((error) => {
    console.log("Error connecting to mongodb", error);
  });
