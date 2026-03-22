import * as React from 'react';

interface MonthlyReportEmailProps {
  userName: string;
  month: string;
  year: number;
  totalSpent: number;
  currency: string;
  categoryBreakdown: Array<{ category: string; total: number }>;
  budgetPerformance: Array<{ category: string; limit: number; spent: number; status: 'over' | 'warning' | 'ok' }>;
  topMerchants: Array<{ merchant: string; total: number }>;
  savingsGoals: Array<{ title: string; saved: number; target: number; percentage: number }>;
  insight: string;
}

const currencySymbol: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };

export const MonthlyReportEmail: React.FC<MonthlyReportEmailProps> = ({
  userName,
  month,
  year,
  totalSpent,
  currency,
  categoryBreakdown,
  budgetPerformance,
  topMerchants,
  savingsGoals,
  insight,
}) => {
  const sym = currencySymbol[currency] || currency;

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <title>SmartXpense Monthly Report</title>
      </head>
      <body style={{ margin: 0, padding: 0, backgroundColor: '#f8fafc', fontFamily: 'Inter, -apple-system, sans-serif' }}>
        <table width="100%" cellPadding={0} cellSpacing={0} style={{ backgroundColor: '#f8fafc', padding: '40px 0' }}>
          <tr>
            <td align="center">
              <table width="600" cellPadding={0} cellSpacing={0} style={{ backgroundColor: '#ffffff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                {/* Header */}
                <tr>
                  <td style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', padding: '40px 32px', textAlign: 'center' }}>
                    <h1 style={{ margin: 0, color: '#ffffff', fontSize: '28px', fontWeight: 700 }}>💰 SmartXpense</h1>
                    <p style={{ margin: '8px 0 0', color: '#c7d2fe', fontSize: '16px' }}>
                      Your {month} {year} Spending Report
                    </p>
                  </td>
                </tr>

                {/* Greeting */}
                <tr>
                  <td style={{ padding: '32px 32px 0' }}>
                    <p style={{ margin: 0, color: '#374151', fontSize: '16px' }}>
                      Hi <strong>{userName}</strong>, here's a summary of your spending for <strong>{month} {year}</strong>.
                    </p>
                  </td>
                </tr>

                {/* Total Spent */}
                <tr>
                  <td style={{ padding: '24px 32px' }}>
                    <table width="100%" cellPadding={0} cellSpacing={0} style={{ backgroundColor: '#eef2ff', borderRadius: '8px', padding: '24px', textAlign: 'center' }}>
                      <tr>
                        <td>
                          <p style={{ margin: 0, color: '#6366f1', fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Spent</p>
                          <p style={{ margin: '8px 0 0', color: '#1e1b4b', fontSize: '40px', fontWeight: 700 }}>{sym}{totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                {/* Category Breakdown */}
                <tr>
                  <td style={{ padding: '0 32px 24px' }}>
                    <h2 style={{ margin: '0 0 16px', color: '#111827', fontSize: '18px', fontWeight: 600 }}>📊 Category Breakdown</h2>
                    <table width="100%" cellPadding={0} cellSpacing={0}>
                      <tr style={{ backgroundColor: '#f3f4f6' }}>
                        <td style={{ padding: '8px 12px', color: '#6b7280', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Category</td>
                        <td style={{ padding: '8px 12px', color: '#6b7280', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', textAlign: 'right' }}>Amount</td>
                        <td style={{ padding: '8px 12px', color: '#6b7280', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', textAlign: 'right' }}>% of Total</td>
                      </tr>
                      {categoryBreakdown.map((item, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '10px 12px', color: '#374151', fontSize: '14px' }}>{item.category}</td>
                          <td style={{ padding: '10px 12px', color: '#374151', fontSize: '14px', textAlign: 'right', fontWeight: 500 }}>{sym}{item.total.toFixed(2)}</td>
                          <td style={{ padding: '10px 12px', color: '#6b7280', fontSize: '14px', textAlign: 'right' }}>{totalSpent > 0 ? ((item.total / totalSpent) * 100).toFixed(1) : 0}%</td>
                        </tr>
                      ))}
                    </table>
                  </td>
                </tr>

                {/* Budget Performance */}
                {budgetPerformance.length > 0 && (
                  <tr>
                    <td style={{ padding: '0 32px 24px' }}>
                      <h2 style={{ margin: '0 0 16px', color: '#111827', fontSize: '18px', fontWeight: 600 }}>🎯 Budget Performance</h2>
                      <table width="100%" cellPadding={0} cellSpacing={0}>
                        {budgetPerformance.map((b, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td style={{ padding: '10px 12px', color: '#374151', fontSize: '14px' }}>{b.category}</td>
                            <td style={{ padding: '10px 12px', fontSize: '14px', textAlign: 'right' }}>
                              <span style={{ color: b.status === 'over' ? '#ef4444' : b.status === 'warning' ? '#f59e0b' : '#10b981', fontWeight: 600 }}>
                                {sym}{b.spent.toFixed(2)} / {sym}{b.limit.toFixed(2)}
                              </span>
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                              <span style={{ backgroundColor: b.status === 'over' ? '#fee2e2' : b.status === 'warning' ? '#fef3c7' : '#d1fae5', color: b.status === 'over' ? '#ef4444' : b.status === 'warning' ? '#f59e0b' : '#10b981', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>
                                {b.status === 'over' ? 'Over Budget' : b.status === 'warning' ? 'Near Limit' : 'On Track'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </table>
                    </td>
                  </tr>
                )}

                {/* Top Merchants */}
                {topMerchants.length > 0 && (
                  <tr>
                    <td style={{ padding: '0 32px 24px' }}>
                      <h2 style={{ margin: '0 0 16px', color: '#111827', fontSize: '18px', fontWeight: 600 }}>🏪 Top 3 Merchants</h2>
                      {topMerchants.slice(0, 3).map((m, i) => (
                        <table key={i} width="100%" cellPadding={0} cellSpacing={0} style={{ marginBottom: '8px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
                          <tr>
                            <td style={{ padding: '10px 12px', color: '#374151', fontSize: '14px' }}>
                              <span style={{ fontWeight: 600 }}>#{i + 1}</span> {m.merchant}
                            </td>
                            <td style={{ padding: '10px 12px', color: '#6366f1', fontSize: '14px', textAlign: 'right', fontWeight: 600 }}>{sym}{m.total.toFixed(2)}</td>
                          </tr>
                        </table>
                      ))}
                    </td>
                  </tr>
                )}

                {/* Savings Goals */}
                {savingsGoals.length > 0 && (
                  <tr>
                    <td style={{ padding: '0 32px 24px' }}>
                      <h2 style={{ margin: '0 0 16px', color: '#111827', fontSize: '18px', fontWeight: 600 }}>💰 Savings Goals</h2>
                      {savingsGoals.map((g, i) => (
                        <table key={i} width="100%" cellPadding={0} cellSpacing={0} style={{ marginBottom: '12px' }}>
                          <tr>
                            <td style={{ padding: '0 0 4px' }}>
                              <span style={{ color: '#374151', fontSize: '14px', fontWeight: 500 }}>{g.title}</span>
                              <span style={{ color: '#6b7280', fontSize: '13px', marginLeft: '8px' }}>{sym}{g.saved.toFixed(2)} / {sym}{g.target.toFixed(2)}</span>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <div style={{ backgroundColor: '#e5e7eb', borderRadius: '9999px', height: '8px' }}>
                                <div style={{ backgroundColor: '#6366f1', borderRadius: '9999px', height: '8px', width: `${Math.min(g.percentage, 100)}%` }} />
                              </div>
                            </td>
                          </tr>
                        </table>
                      ))}
                    </td>
                  </tr>
                )}

                {/* Key Insight */}
                <tr>
                  <td style={{ padding: '0 32px 32px' }}>
                    <table width="100%" cellPadding={0} cellSpacing={0} style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '16px' }}>
                      <tr>
                        <td style={{ padding: '16px' }}>
                          <p style={{ margin: 0, color: '#92400e', fontSize: '14px' }}>
                            💡 <strong>Key Insight:</strong> {insight}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                {/* Footer */}
                <tr>
                  <td style={{ backgroundColor: '#f9fafb', padding: '24px 32px', textAlign: 'center', borderTop: '1px solid #e5e7eb' }}>
                    <p style={{ margin: 0, color: '#9ca3af', fontSize: '13px' }}>
                      This report was automatically generated by SmartXpense.<br />
                      CSV attachment contains all transactions for {month} {year}.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  );
};
