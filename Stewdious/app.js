require("dotenv").config();
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { check, validationResult } = require("express-validator");
const connectDB = require("./src/db");
const User = require("./src/User");
const Teacher = require("./src/Teacher");

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

app.use(express.json());
app.use(express.static(path.join(__dirname, "")));
app.use(bodyParser.urlencoded({ extended: false }));

// Middleware to authenticate token
const auth = (req, res, next) => {
  const token = req.header("x-auth-token");
  console.log("Received token:", token); // Log the received token
  if (!token) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    console.log("Authenticated user:", req.user); // Log authenticated user
    next();
  } catch (err) {
    console.error("Token verification failed:", err);
    res.status(401).json({ msg: "Token is not valid" });
  }
};

// Middleware to authenticate admin role
const adminAuth = (req, res, next) => {
  console.log("User role:", req.user.role); // Log user role
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ msg: "Admin access required" });
  }
};

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "/Pages/signup.html"));
});

app.post(
  "/signup",
  [
    check("name", "Name is required").not().isEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check(
      "password",
      "Please enter a password with 6 or more characters"
    ).isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, hobbies, adminSecret } = req.body;

    try {
      let user = await User.findOne({ email });
      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: "User already exists" }] });
      }

      user = new User({
        name,
        email,
        password,
        hobbies,
        role: adminSecret === process.env.ADMIN_SECRET ? 'admin' : 'user'
      });

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      await user.save();

      const payload = {
        user: {
          id: user.id,
          role: user.role // Include role in the payload
        },
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: 360000 },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

app.post(
  "/login",
  [
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password is required").exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      let user = await User.findOne({ email });
      if (!user) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Invalid credentials" }] });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Invalid credentials" }] });
      }

      const payload = {
        user: {
          id: user.id,
          role: user.role // Include role in the payload
        },
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: 360000 },
        (err, token) => {
          if (err) throw err;
          res.json({ token, role: user.role });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);
app.get("/api/auth", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    res.json({ user });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

app.post(
  "/teachers",
  auth,
  adminAuth,
  [
    check("name", "Name is required").not().isEmpty(),
    check("instruments", "Instruments are required").isArray({ min: 1 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, instruments, profile, contact } = req.body;

    try {
      const teacher = new Teacher({
        name,
        instruments,
        profile,
        contact,
      });

      await teacher.save();
      res.json({ msg: "Teacher profile created", teacher });
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

app.put(
  "/teachers/:id",
  auth,
  adminAuth,
  [
    check("name", "Name is required").not().isEmpty(),
    check("instruments", "Instruments are required").isArray({ min: 1 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, instruments, profile, contact } = req.body;

    try {
      let teacher = await Teacher.findById(req.params.id);
      if (!teacher) {
        return res.status(404).json({ msg: "Teacher not found" });
      }

      teacher.name = name;
      teacher.instruments = instruments;
      teacher.profile = profile;
      teacher.contact = contact;

      await teacher.save();
      res.json({ msg: "Teacher profile updated", teacher });
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

app.delete("/teachers/:id", auth, adminAuth, async (req, res) => {
  try {
    const teacher = await Teacher.findByIdAndDelete(req.params.id);
    if (!teacher) {
      return res.status(404).json({ msg: "Teacher not found" });
    }

    res.json({ msg: "Teacher removed" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});



app.get("/teachers", auth, async (req, res) => {
  try {
    const teachers = await Teacher.find();
    res.json(teachers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

app.get("/dashboard", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    const hobbies = user.hobbies;

    const teachers = await Teacher.find({
      instruments: { $in: hobbies },
    });

    res.json({ name: user.name, hobbies: hobbies, teachers: teachers });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "/Pages/error.html"));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
