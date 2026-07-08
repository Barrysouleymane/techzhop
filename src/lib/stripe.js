import { loadStripe } from '@stripe/stripe-js'

export const stripePromise = loadStripe(
  'pk_test_51TYsFB2dU28KLssWsvq8vP0idjmJ33TpCYhkLfqbj8Y837uaEjFDukUlCPPzCGVCj0A9VsvYnOgjLwExZI4uxolX00RvLX0n9v'
)