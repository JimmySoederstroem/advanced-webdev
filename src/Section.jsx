import React from 'react';

function Section({ id, title, content, children }) {
  return (
    <section id={id} className="section">
      <h2>{title}</h2>
      {content && <p>{content}</p>}
      {children}
    </section>
  );
}

export default Section;