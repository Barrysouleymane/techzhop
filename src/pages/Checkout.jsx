import axios from 'axios'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(
  'pk_test_51TYsFB2dU28KLssWsvq8vP0idjmJ33TpCYhkLfqbj8Y837uaEjFDukUlCPPzCGVCj0A9VsvYnOgjLwExZI4uxolX00RvLX0n9v'
)

function Checkout() {

  const handleCheckout = async () => {

    alert('BUTTON WORKING')

    try {

      const product = {
        title: 'iPhone 14 Pro',
        price: 1000
      }

      const response = await axios.post(
        'http://localhost:8000/create-checkout-session',
        { product }
      )

      console.log('SESSION:', response.data)

      const stripe = await stripePromise

      const result = await stripe.redirectToCheckout({
        sessionId: response.data.id
      })

      if (result.error) {
        alert(result.error.message)
      }

    } catch (error) {

      console.error(error)

      alert(
        error.response?.data?.error ||
        error.message ||
        'Erreur inconnue'
      )

    }

  }

  return (
    <div className="container mt-5">

      <h1>Checkout</h1>

      <p>Secure payment powered by Stripe</p>

      <button
        className="btn btn-primary"
        onClick={handleCheckout}
      >
        Pay Now
      </button>

    </div>
  )
}

export default Checkout