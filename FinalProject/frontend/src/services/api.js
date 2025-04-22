import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const register = async (userData) => {
  const response = await axios.post(`${API_URL}/register`, userData);
  return response.data;
};

export const login = async (userData) => {
  const response = await axios.post(`${API_URL}/login`, userData);
  return response.data;
};

export const getExpenses = async (userId, token) => {
  const response = await axios.get(`${API_URL}/expenses/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const addExpense = async (expenseData, token) => {
  const response = await axios.post(`${API_URL}/expenses`, expenseData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const saveBudget = async (userId, budget, token) => {
  // Implement the API call to save the budget
};
