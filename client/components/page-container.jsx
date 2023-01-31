import React from 'react';

const styles = {
  page: {
    minHeight: 'calc(100vh - 3.5rem)',
    minWidth: 375
  }
};

export default function PageContainer({ children }) {
  return (
    <div>
      <div className="container px-4" style={styles.page}>
        {children}
      </div>
    </div>
  );

}
