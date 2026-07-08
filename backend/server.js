require('dotenv').config()

console.log('STRIPE KEY = ')
console.log(process.env.STRIPE_SECRET_KEY)

const express = require('express')
const cors = require('cors')

const stripe = require('stripe')(
  process.env.STRIPE_SECRET_KEY
)

const { createClient } = require('@supabase/supabase-js')

const app = express()

app.use(cors())
app.use(express.json())

// SUPABASE
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)


// ========================================
// HOME ROUTE
// ========================================

app.get('/', (req, res) => {
  res.send('🚀 TechZhop API Running')
})


// ========================================
// GET PRODUCTS
// ========================================

app.get('/products', async (req, res) => {

  try {

    const { data, error } = await supabase
      .from('products')
      .select('*')

    if (error) {
      return res.status(500).json({
        error: error.message
      })
    }

    res.json(data)

  } catch (err) {

    res.status(500).json({
      error: err.message
    })

  }

})


// ========================================
// ADD PRODUCT
// ========================================

app.post('/products', async (req, res) => {

  try {

    const {
      title,
      description,
      price,
      image,
      stock
    } = req.body

    const { data, error } = await supabase
      .from('products')
      .insert([
        {
          title,
          description,
          price,
          image,
          stock
        }
      ])

    if (error) {
      return res.status(500).json({
        error: error.message
      })
    }

    res.json({
      success: true,
      data
    })

  } catch (err) {

    res.status(500).json({
      error: err.message
    })

  }

})


// ========================================
// CREATE STRIPE CHECKOUT SESSION
// ========================================

app.post('/create-checkout-session', async (req, res) => {

  try {

    const { product } = req.body

    const session = await stripe.checkout.sessions.create({

      payment_method_types: ['card'],

      line_items: [
        {
          price_data: {
            currency: 'usd',

            product_data: {
              name: product.title
            },

            unit_amount: product.price * 100
          },

          quantity: 1
        }
      ],

      mode: 'payment',

      success_url:
        'http://localhost:5173/success',

      cancel_url:
        'http://localhost:5173/cancel'

    })

    res.json({
      id: session.id
    })

  } catch (err) {

    res.status(500).json({
      error: err.message
    })

  }

})


// ========================================
// START SERVER
// ========================================

app.listen(process.env.PORT, () => {

  console.log(
    `✅ Server running on port ${process.env.PORT}`
  )

})