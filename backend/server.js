
require('dotenv').config()

const express = require('express')

const authRouter = require('./routes/AuthRouter');
const UserRouter = require('./routes/UserRouter');

const app = express()
const PORT = process.env.PORT || 3000


/**
 * Registers built-in Express middleware to parse incoming request bodies.
 */
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

/**
 * Routers
 */


app.use('/api/auth', authRouter)
app.use('/api/users', UserRouter)

app.listen(PORT, ()=>{
    console.log('Server is running on http://localhost:'+ PORT)
})

