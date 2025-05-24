// This is an example for a SIGN-UP AND LOGIN operations over an http server using jwt.

const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const z = require("zod");
const mongoose = require("mongoose")
const { authenticateToken } = require("./middlewares.js")
require("dotenv").config()

mongoose.connect(process.env.MONGO_URI);

const JWT_SECRET = process.env.JWT_SECRET;


const app = express();
app.use(express.json());

const userSchemaMongoose = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});
const User = mongoose.model("User", userSchemaMongoose)


// Zod schema for validating signup/login inputs
const userSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
});

// Signup route
app.post("/signup", async (req, res) => {
  const result = userSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({ error: result.error.errors });
  }

  const { name, email, password } = result.data;
  try{
    const existingUser = await User.findOne({ email });
    if (existingUser) {
    return res.status(409).json({ message: "User with same email already exists"});
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({name, email, password: hashedPassword})
  await newUser.save()

  res.status(201).json({ message: "Signup successful" })
  
}
catch (error){
  console.error(error)
  res.status(500).json({ message: "Internal server error" })
}
})

// Login route
app.post("/login", async (req, res) => {
  const result = userSchema.pick({ email: true, password: true}).safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({ error: result.error.errors });
  }

  const { email, password } = result.data;

  try {
    const user = await User.findOne({ email })
    if (!user){
      return res.status(401).send({ message: "Invalid email or password"})
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
    return res.status(401).json({ message: "Invalid username or password" });
    }

    // Generate jwt token
    const token = jwt.sign({ userId: user._id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: "1h" });
    res.json({ message: "Login successful", token });
  } catch (error) {
    console.error(error)
    res.status(500).send({ message: "Internal server error"})
  }
})

// Protected route example
app.get("/profile", authenticateToken, (req, res) => { 
  res.send({ message: "Acsess granted", user: req.user })
})

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
