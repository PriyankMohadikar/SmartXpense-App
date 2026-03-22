import * as React from 'react';

interface WelcomeEmailProps {
  userName: string;
}

export const WelcomeEmail: React.FC<WelcomeEmailProps> = ({ userName }) => {
  return (
    <div style={{ fontFamily: 'sans-serif', color: '#1a1a1a', padding: '20px' }}>
      <h1 style={{ color: '#6366f1' }}>Welcome to SmartXpense, {userName}! 🎉</h1>
      <p style={{ fontSize: '16px', lineHeight: '1.5' }}>
        We are thrilled to have you on board. SmartXpense is your intelligent personal finance companion.
      </p>
      <p style={{ fontSize: '16px', lineHeight: '1.5' }}>
        With SmartXpense, you can track your expenses effortlessly, set and monitor budgets, and save up for your goals!
      </p>
      <hr style={{ margin: '30px 0', borderColor: '#e5e7eb', borderStyle: 'solid' }} />
      <p style={{ fontSize: '14px', color: '#6b7280' }}>
        Log in to your dashboard to add your first expense.
      </p>
      <p style={{ fontSize: '14px', color: '#6b7280' }}>
        Best regards,<br />
        The SmartXpense Team
      </p>
    </div>
  );
};
