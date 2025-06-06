// export const API = 'http://localhost:3000';
export const API = 'https://prepsync.onrender.com';

export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};
