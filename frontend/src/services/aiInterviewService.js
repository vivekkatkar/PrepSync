import axios from 'axios';
import { API } from '../utils/api';

export async function checkEligibility(token) {
  const res = await axios.get(`${API}/services/ai-interview/iseligible`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}
