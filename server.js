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

// verify login token, this should be called before any other route
// app.post("/checkToken", (req, res) => {
//   const { token } = ;
//   jwt.verify(token, jwtsecret, (err, decoded) => {
//     if (err) {
//       res.status(401).json({ message: "Invalid token.", status: false });
//     } else {
//       res.status(200).json({ message: "Valid token.", status: true });
//     }
//   });
// });

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
