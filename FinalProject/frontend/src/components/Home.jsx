import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  return (
    <div className="home-container">
      <h1>Welcome to the Expense Tracker App!</h1>
      <p>Manage your expenses effortlessly and gain insights into your spending habits.</p>
      <div className="button-container">
        <Link to="/register" className="btn">Register</Link>
        <Link to="/login" className="btn">Login</Link>
      </div>
    </div>
  );
};

export default Home;
