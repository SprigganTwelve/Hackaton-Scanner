
require('dotenv').config()

const express = require('express')

const authRouter = require('./routes/AuthRouter');
const UserRouter = require('./routes/UserRouter');
const UserQueryRouter = require('./routes/UserQueryRouter');

const app = express()
const PORT = process.env.PORT || 3000
const cors = require('cors')

/**
 * Registers built-in Express middleware to parse incoming request bodies.
 */
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors({
    origin: '*'
}))

/**
 * Routers
 */
app.use('/api/auth', authRouter)
app.use('/api/users', UserRouter)
app.use('/api/users', UserQueryRouter);

app.get('/api/test', (_req, res)=>{
    console.log("BACKEND API TEST")
    return res.send({ message: "Everything went smoothly" })
})

app.listen(PORT, ()=>{
    console.log('Server is running on http://localhost:'+ PORT)
})

