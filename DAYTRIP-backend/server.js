import express from 'express'
import cors    from 'cors'
import dotenv  from 'dotenv'
dotenv.config()

import authRoutes    from './routes/auth.js'
import userRoutes    from './routes/users.js'
import orderRoutes   from './routes/orders.js'
import paymentRoutes from './routes/payments.js'
import couponRoutes  from './routes/coupons.js'

const app = express()

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

app.use('/api/auth',     authRoutes)
app.use('/api/users',    userRoutes)
app.use('/api/orders',   orderRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/coupons',  couponRoutes)

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'ok' }))

app.listen(process.env.PORT || 4000, () => {
    console.log(`✅ Backend running → http://localhost:${process.env.PORT || 4000}`)
})
