import axios from "axios";
import { API_URL } from "@/config/constants";
import { authHeaders } from "@/api/account";

export async function getReviews(productId) {
  const res = await axios.get(`${API_URL}/products/${productId}/reviews`);
  return res.data.reviews || [];
}

export async function canReview(productId) {
  try {
    const res = await axios.get(`${API_URL}/products/${productId}/can-review`, { headers: await authHeaders() });
    return !!res.data.canReview;
  } catch {
    return false;
  }
}

export async function postReview(productId, review) {
  const res = await axios.post(`${API_URL}/products/${productId}/reviews`, review, { headers: await authHeaders() });
  return res.data.review;
}

export async function deleteReview(id) {
  await axios.delete(`${API_URL}/reviews/${id}`, { headers: await authHeaders() });
}
