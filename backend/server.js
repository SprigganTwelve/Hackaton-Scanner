
require('dotenv').config()

const express = require('express')
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
const authRouter = require('./controllers/AuthController')

app.use('/api/users', authRouter)

app.listen(PORT, ()=>{
    console.log('Server is running on http://localhost:'+ PORT)
})