import axios from 'axios';

const API_BASE = 'http://localhost:3000';

export async function checkEligibility(token) {
  const res = await axios.get(`${API_BASE}/services/ai-interview/iseligible`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}
