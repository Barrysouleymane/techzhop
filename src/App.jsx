import { useEffect, useState } from 'react'
import { Routes, Route, Link } from 'react-router-dom'

import { supabase } from './lib/supabase'

import Login from './pages/Login'
import Register from './pages/Register'
import Checkout from './pages/Checkout'

import CheckoutButton from './components/CheckoutButton'

function Home() {

  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [user, setUser] = useState(null)

  useEffect(() => {
    getProducts()
    checkUser()
  }, [])

  async function getProducts() {

    const { data, error } = await supabase
      .from('products')
      .select('*')

    if (!error) {
      setProducts(data)
    }
  }

  async function checkUser() {

    const { data } = await supabase.auth.getUser()

    if (data.user) {
      setUser(data.user)
    }
  }

  async function logout() {

    await supabase.auth.signOut()

    setUser(null)
  }

  function addToCart(product) {
    setCart([...cart, product])
  }

  const total = cart.reduce(
    (sum, item) => sum + Number(item.price.replace('$', '')),
    0
  )

  return (

    <div className="bg-black min-h-screen text-white">

      {/* NAVBAR */}

      <nav className="flex justify-between items-center px-10 py-6 border-b border-gray-800">

        <h1 className="text-4xl font-bold text-cyan-400">
          TECHZHOP
        </h1>

        <div className="space-x-6 text-lg flex items-center">

          <Link to="/">Home</Link>

          <Link to="/">
            Products
          </Link>

          <Link to="/">
            Cart ({cart.length})
          </Link>
          <Link to="/checkout">Checkout</Link>

          {user ? (

            <>
              <span className="text-cyan-400">
                {user.email}
              </span>

              <button
                onClick={logout}
                className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-xl"
              >
                Logout
              </button>
            </>

          ) : (

            <>
              <Link to="/login">
                Login
              </Link>

              <Link to="/register">
                Register
              </Link>
            </>

          )}

        </div>

      </nav>

      {/* HERO */}

      <section className="text-center py-20 px-5">

        <h2 className="text-6xl font-bold mb-6">
          Modern Tech Store
        </h2>

        <p className="text-gray-400 text-xl mb-8">
          Smart gadgets, gaming, electronics and premium accessories
        </p>

      </section>

      {/* PRODUCTS */}

      <section className="px-10 pb-20">

        <h3 className="text-4xl font-bold mb-10">
          Trending Products
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

          {products.map((product) => (

            <div
              key={product.id}
              className="bg-gray-900 rounded-2xl overflow-hidden shadow-lg hover:scale-105 transition duration-300"
            >

              <img
                src={product.image}
                alt={product.name}
                onError={(e) => {
                  e.target.src =
                    'https://via.placeholder.com/400x300?text=TECHZHOP'
                }}
                className="w-full h-64 object-cover"
              />

              <div className="p-5">

                <h2 className="text-2xl font-bold mb-2">
                  {product.name}
                </h2>

                <p className="text-cyan-400 text-xl mb-3">
                  {product.price}
                </p>

                <p className="text-gray-400 mb-5">
                  {product.description}
                </p>

                <button
                  onClick={() => addToCart(product)}
                  className="bg-cyan-500 hover:bg-cyan-600 w-full py-3 rounded-xl font-semibold"
                >
                  Add to Cart
                </button>

              </div>

            </div>

          ))}

        </div>

      </section>

      {/* CART */}

      <section className="px-10 pb-20">

        <h3 className="text-4xl font-bold mb-8">
          Shopping Cart
        </h3>

        <div className="bg-gray-900 p-8 rounded-2xl">

          {cart.length === 0 ? (

            <p className="text-gray-400">
              Your cart is empty
            </p>

          ) : (

            <div>

              {cart.map((item, index) => (

                <div
                  key={index}
                  className="flex justify-between border-b border-gray-700 py-4"
                >

                  <p>{item.name}</p>

                  <p className="text-cyan-400">
                    {item.price}
                  </p>

                </div>

              ))}

              <div className="flex justify-between mt-8 text-2xl font-bold">

                <h4>Total:</h4>

                <h4 className="text-cyan-400">
                  ${total}
                </h4>

              </div>

              <Link to="/checkout">
                <CheckoutButton />
              </Link>

            </div>

          )}

        </div>

      </section>

    </div>

  )
}

export default function App() {

  return (

    <Routes>

      <Route path="/" element={<Home />} />

      <Route path="/login" element={<Login />} />

      <Route path="/register" element={<Register />} />

      <Route path="/checkout" element={<Checkout />} />

    </Routes>

  )
}