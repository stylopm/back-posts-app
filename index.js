const express = require('express')
const app = express()
const userRoutes = require('./routes/users')
const cors = require('cors')
const connectDB = require('./config/db')

require('dotenv').config()
connectDB()

app.use(cors())
app.use(express.json())

//3. Rutas
app.use('/usuario', userRoutes)
app.get('/', (req, res) => res.send('UCAMP API POSTS'))

// 4. SERVIDOR
app.listen(process.env.PORT, () => {
	console.log('El servidor está corriendo en ' + process.env.PORT)
})
