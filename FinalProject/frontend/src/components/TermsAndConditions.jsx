// src/components/TermsAndConditions.jsx
import React from 'react';
import { Link } from 'react-router-dom';

function TermsAndConditions() {
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '40px auto', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'}}>
      <h2>Terms and Conditions</h2>
      <p>Welcome to Expense Tracker!</p>

      <p>These terms and conditions outline the rules and regulations for the use of Expense Tracker's Website, located at [Your Website URL if applicable].</p>

      <p>By accessing this website we assume you accept these terms and conditions. Do not continue to use Expense Tracker if you do not agree to take all of the terms and conditions stated on this page.</p>

      <p><strong>Placeholder Content:</strong> Please replace this with your actual terms and conditions. This section should detail user responsibilities, data privacy (linking to a privacy policy if separate), limitations of liability, intellectual property rights, termination conditions, governing law, etc.</p>

      <p><strong>1. Acceptance of Terms</strong></p>
      <p>By registering for and/or using the Service in any manner, you agree to these Terms and Conditions and all other operating rules, policies and procedures that may be published from time to time on the Site by us.</p>

      <p><strong>2. Use License</strong></p>
      <p>Permission is granted to temporarily download one copy of the materials on Expense Tracker's Website for personal, non-commercial transitory viewing only. [...]</p>

      <p><strong>3. Disclaimer</strong></p>
      <p>The materials on Expense Tracker's Website are provided 'as is'. Expense Tracker makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights. [...]</p>

      <p><strong>4. Limitations</strong></p>
      <p>[...]</p>

      <p><strong>5. Governing Law</strong></p>
      <p>[...]</p>

      <p><em>Last updated: [Date]</em></p>

      <div style={{ marginTop: '30px', textAlign: 'center' }}>
         {/* Allow navigation back or to registration */}
        <Link to="/register">Back to Registration</Link>
      </div>
    </div>
  );
}

export default TermsAndConditions;