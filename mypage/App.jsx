import React, { useEffect } from 'react';
import './mypage.css'; // Import the new CSS file
import Header from './Header';
import Section from './Section';
import Footer from './Footer';

function App() {
  useEffect(() => {
    const anchors = document.querySelectorAll('.navigation a');
    anchors.forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
          behavior: 'smooth'
        });
      });
    });
  }, []);

  return (
    <div className="app">
      <Header />
      <Section id="home" title="Welcome to My Page" content="Your one-stop solution for all your service needs." />
      <Section id="about" title="About Us" content="We are a company dedicated to providing the best services to our customers." />
      <Section id="services" title="Our Services">
        <ul>
          <li>Service 1: Custom Solutions</li>
          <li>Service 2: Expert Consulting</li>
          <li>Service 3: Reliable Support</li>
        </ul>
      </Section>
      <Section id="contact" title="Contact Us">
        <p>Email: contact@ourcompany.com</p>
        <p>Phone: +123 456 7890</p>
      </Section>
      <Footer />
    </div>
  );
}

export default App;