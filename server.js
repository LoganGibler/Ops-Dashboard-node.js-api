// const { Client } = require("pg");
const express = require("express");
const mongoose = require("mongoose");
const app = express();
const cors = require("cors");
require("dotenv").config();
const jwtsecret = process.env.JWT_SECRET;
const bcrypt = require("bcrypt");
// const client = new Client(process.env.DATABASE_URL);
const jwt = require("jsonwebtoken");
// const morgan = require("morgan");
const cookieParser = require("cookie-parser");

app.enable("trust proxy");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// app.use(morgan("dev"));
app.use(
  cors({
    credentials: true,
    origin: "https://seg-ops-bulletin.netlify.app/", // Replace with your client's origin
    // origin: "http://localhost:5173",
  })
);

const Users = require("./Schemas/userModel");
const Turnover = require("./Schemas/turnoverModel");
const Bulletin = require("./Schemas/bulletinModel");
const Alerts = require("./Schemas/alertsModel");
const Contacts = require("./Schemas/contactsModel");
const Workflows = require("./Schemas/workflowModel");

// middleware
async function authenticateToken(req, res, next) {
  // Get auth header value
  const token = req.headers["authorization"];
  console.log("bearerHeader: ", token);

  if (typeof token !== "undefined") {
    jwt.verify(token, process.env.JWT_SECRET, function (err, decodedToken) {
      if (err) {
        console.info("token did not work");
        return res.status(403).send("Error");
      }
      console.log(decodedToken, "!!!!!!!!!");
      req.token = token;
      req.decodedToken = decodedToken;
      next();
    });
  } else {
    res.sendStatus(403);
  }
}

app.get("/protected", authenticateToken, async (req, res) => {
  // This route is protected and can only be accessed by authenticated users.

  res.status(200).json({ auth: true });
  // res.send("You are authenticated");
});

// routes

app.get("/testConnection", async (req, res) => {
  res.send("Connected");
});

app.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    const salt = await bcrypt.genSalt();
    const userCheck = await Users.findOne({ username });
    if (userCheck) {
      return res.status(400).json({ message: "Username already exists." });
    }

    const hashedPassword = bcrypt.hashSync(password, salt);
    const user = await Users.create({
      username: username,
      password: hashedPassword,
    });
    // console.log("Registered user:", user);
    res.status(200).json({ message: "User created successfully", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/login", async (req, res) => {
  let { username, password } = req.body;
  try {
    const user = await Users.findOne({ username: req.body.username });

    // console.log("found user: ", user);

    if (!user) {
      return res.status(402).json({ message: "Invalid credentials." });
    }

    bcrypt.compare(password, user.password, (err, result) => {
      if (err) {
        return res.status(403).json({ message: "Invalid credentials." });
      }
      if (result) {
        const token = jwt.sign({ username }, jwtsecret, {
          expiresIn: "2h",
        });
        console.log("Generated Token: ", token);
        return res.cookie("auth", token).json({ token });
      } else {
        return res.status(404).json({ message: "Invalid credentials." });
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Login has failed." });
  }
});

app.post("/logout", async (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ success: true, message: "Logout successful" });
});

// content

// Turnover Querys
app.post("/turnover", authenticateToken, async (req, res) => {
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
    if (updatedTurnover) {
      res.status(200).json({ message: "Turnover updated successfully" });
    } else {
      res.status(500).json({ message: "failed to update turnover." });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/createTurnover", authenticateToken, async (req, res) => {
  try {
    const { newData, date, username } = req.body;

    const updatedData = await Turnover.create({
      turnover: newData,
      date: date,
      username: username,
      unchanged: true,
    });

    if (updatedData) {
      res.status(200).json({ message: "new Turnover created successfully." });
    }
  } catch (error) {
    res.status(500).json({ message: "/createTurnover request has failed." });
  }
});

// Bulletin querys
app.post("/bulletin", authenticateToken, async (req, res) => {
  try {
    const bulletinBoard = await Bulletin.find({});
    if (bulletinBoard) {
      res.status(200).json({ bulletinBoard });
    } else {
      res.status(200).json({
        message: "No notes were found on the bulletin board.",
        empty: true,
      });
    }
  } catch (error) {
    res.status(500).json({ message: "/bulletin request has failed." });
  }
});

app.post("/addNote", authenticateToken, async (req, res) => {
  try {
    const { note, username, date } = req.body;
    const newNote = await Bulletin.create({
      note: note,
      username: username,
      date: date,
      completed: false,
    });
    res.status(200).json({ message: "Note created." });
  } catch (error) {
    throw error;
  }
});

app.post("/updateNote", authenticateToken, async (req, res) => {
  try {
    const { newData, noteID, username, date } = req.body;
    const update = { note: newData, username: username, date: date };
    const filter = { _id: noteID };
    const updatedNote = await Bulletin.updateOne(filter, update);
    if (updatedNote) {
      res.status(200).json({ message: "Note updated successfully" });
    } else {
      res.status(500).json({ message: "Note failed to update." });
    }
  } catch (error) {
    res.status(500).json({ message: "Failed to update note." });
  }
});

app.post("/completeNote", authenticateToken, async (req, res) => {
  try {
    const { noteID, username, date } = req.body;
    const update = { completed: true, username: username, date: date };
    const filter = { _id: noteID };
    const completedNote = await Bulletin.updateOne(filter, update);
    if (completedNote) {
      res.status(200).json({ message: "note completed successfully." });
    } else {
      res.status(500).json({ message: "Failed to complete ticket." });
    }
  } catch (error) {
    res.status(500).json({ message: "/completeNote request has failed." });
  }
});

app.post("/uncompleteNote", authenticateToken, async (req, res) => {
  try {
    const { noteID, username, date } = req.body;
    const filter = { _id: noteID };
    const update = { completed: false, username: username, date: date };
    const updatedNote = await Bulletin.updateOne(filter, update);
    res.status(200).json({ message: "note updated successfully." });
  } catch (error) {
    res.status(500).json({ message: "/uncompleteNote" });
  }
});

app.post("/closeNote", authenticateToken, async (req, res) => {
  try {
    const { noteID } = req.body;
    const filter = { _id: noteID };
    const deletedNote = await Bulletin.deleteOne(filter);
    res
      .status(200)
      .json({ message: "Note successfully deleted.", deletedNote });
  } catch (error) {
    res.status(500).json({ message: "/closeNote failed." });
  }
});

// Alert Guides
// only title and id if guide should be returned
app.get("/getGuides", authenticateToken, async (req, res) => {
  try {
    const guides = await Alerts.find({ published: true });
    res.status(200).json({ guides });
  } catch (error) {
    res.status(500).json({ message: "/getGuides has failed." });
  }
});

app.post("/getUserGuides", async (req, res) => {
  try {
    const filter = { username: req.body.username, published: false };
    const userGuides = await Alerts.find(filter);
    res.status(200).json({ userGuides });
  } catch (error) {
    res.status(500).json({ message: "/getUserGuides failed." });
  }
});

app.post("/getGuide", authenticateToken, async (req, res) => {
  try {
    const filter = { _id: req.body._id };
    const guide = await Alerts.findOne(filter);
    res.status(200).json({ guide });
  } catch (error) {
    res.status(500).json({ message: "/getGuide has failed" });
  }
});

app.post("/createGuide", authenticateToken, async (req, res) => {
  try {
    const newGuide = await Alerts.create(req.body);
    if (newGuide) {
      res.status(200).json({ newGuide });
    } else {
      res.status(500).json({ message: "/createGuide has failed." });
    }
  } catch (error) {
    res.status(500).json({ message: "/createGuide has failed." });
  }
});

app.post("/deleteGuide", authenticateToken, async (req, res) => {
  try {
    const filter = { _id: req.body._id };
    const deletedGuide = await Alerts.deleteOne(filter);
    if (deletedGuide) {
      res.status(200).json({ message: "Guide deleted." });
    } else {
      res.status(500).json({ message: "/deleteGuide failed" });
    }
  } catch (error) {
    res.status(500).json({ message: "/deleteGuide has failed." });
  }
});

app.post("/publishGuide", authenticateToken, async (req, res) => {
  try {
    const update = { published: true };
    const filter = { _id: req.body._id };
    const editedGuide = await Alerts.updateOne(filter, update);
    res.status(200).json({ message: "/publishGuide Successful." });
  } catch (error) {
    res.status(500).json({ message: "/publishGuide has failed." });
  }
});

app.post("/unpublishGuide", authenticateToken, async (req, res) => {
  const update = { published: false };
  const filter = { _id: req.body._id };
  const editedGuide = await Alerts.updateOne(filter, update);
  res.status(200).json({ message: "/unpublishGuide Successful." });
  try {
  } catch (error) {
    res.status(500).json({ message: "/unpublishGuide has failed." });
  }
});

app.post("/addstep", authenticateToken, async (req, res) => {
  try {
    let newStep = {
      step: req.body.step,
    };

    const step = await Alerts.updateOne(
      { _id: req.body._id },
      { $push: { steps: newStep } }
    );
    if (step) {
      res.status(200).json({ message: "/addstep successful." });
    } else {
      res.status(500).json({ message: "/addstep failed." });
    }
  } catch (error) {
    res.status(500).json({ message: "/addstep has failed." });
  }
});

app.post("/removeStep", authenticateToken, async (req, res) => {
  try {
    const { _id, index } = req.body;
    let filter = { _id: _id };
    let update = {};
    let editedStep = "steps." + index + ".step";
    update[editedStep] = null;
    const editedGuide = await Alerts.findOneAndUpdate(filter, update, {
      new: true,
    });
    if (editedGuide) {
      res.status(200).json({ message: "/removeStep successful." });
    }
  } catch (error) {
    res.status(500).json({ message: "/removeStep has failed." });
  }
});

app.post("/updateStep", async (req, res) => {
  const { _id, index, newStepData } = req.body;
  let filter = { _id: _id };
  let update = {};
  let editedStep = "steps." + index + ".step";
  update[editedStep] = newStepData;
  const updatedStep = await Alerts.findOneAndUpdate(filter, update, {
    new: true,
  });
  if (updatedStep) {
    res.status(200).json({ message: "/updateStep successful." });
  } else {
    res.status(500).json({ message: "/updateStep failed." });
  }
  try {
  } catch (error) {
    res.status(500).json({ message: "/createGuide has failed." });
  }
});

app.post("/updateTitle", authenticateToken, async (req, res) => {
  try {
    const filter = { _id: req.body._id };
    const update = { title: req.body.newData };
    const updatedGuide = await Alerts.updateOne(filter, update);
    res.status(200).json({ message: "/updatetitle successful." });
  } catch (error) {
    res.status(500).json({ message: "failure on /updateTitle" });
  }
});

// Contacts querys
app.post("/createContacts", async (req, res) => {
  const { username, data, date } = req.body;

  const contactsData = await Contacts.create({
    username: username,
    contacts: data,
    date: date,
  });

  if (contactsData) {
    res.status(200).json({ message: "Contact page created." });
  } else {
    res.status(500).json({ message: "Contact page creation failed" });
  }
});

app.post("/getContacts", authenticateToken, async (req, res) => {
  const contactsData = await Contacts.find({});
  if (contactsData) {
    res.status(200).json({ contactsData });
    return;
  }
  res
    .status(500)
    .json({ message: "No contact page found. Someone deleted the whole doc!" });
});

app.post("/updateContacts", authenticateToken, async (req, res) => {
  try {
    const { username, newData, date } = req.body;
    const filter = { unchanged: true };
    const update = { username: username, contacts: newData, date: date };
    const updatedContacts = await Contacts.updateOne(filter, update);
    if (updatedContacts) {
      res.status(200).json({ message: "Contacts updated successfully." });
      return;
    }
    res.status(500).json({
      message:
        "Contacts update has failed. Please verify contact data was not deleted.",
    });
  } catch (error) {
    res.status(500).json({ message: "/updateContacts has failed" });
  }
});

app.post("/createWorkflow", async (req, res) => {
  const { username, date, newData } = req.body;
  const newWorkflowPage = await Workflows.create({
    username: username,
    date: date,
    workflows: newData,
  });

  res.status(200).json({ newWorkflowPage });
});

app.get("/getWorkflows", authenticateToken, async (req, res) => {
  try {
    const workflows = await Workflows.findOne({});
    res.status(200).json({ workflows });
  } catch (error) {
    res.status(500).json({ message: "/getWorkflows has failed." });
  }
});

app.post("/updateWorkflows", authenticateToken, async (req, res) => {
  try {
    const { username, date, newData } = req.body;
    const filter = { unchanged: true };
    const update = { workflows: newData, username: username, date: date };
    const newWorkflows = await Workflows.updateOne(filter, update);
    res.status(200).json({ message: "Workflows updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "/updateWorkflows failed." });
  }
});

// process.env.DATABASE_URL_QA
// process.env.DATABASE_URL
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
