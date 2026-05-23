import express from 'express'
import cors    from 'cors'
import dotenv  from 'dotenv'
dotenv.config()

import authRoutes    from './routes/auth.js'
import userRoutes    from './routes/users.js'
import orderRoutes   from './routes/orders.js'
import paymentRoutes from './routes/payments.js'

const app = express()

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

app.use('/api/auth',     authRoutes)
app.use('/api/users',    userRoutes)
app.use('/api/orders',   orderRoutes)
app.use('/api/payments', paymentRoutes)

app.listen(process.env.PORT, () => {
    console.log(`Backend running → http://localhost:${process.env.PORT}`)
})
