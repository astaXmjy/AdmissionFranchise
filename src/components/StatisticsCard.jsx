import React from 'react';
import { Card, Statistic, Row, Col } from 'antd';
import { TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const StatisticsCard = ({ stats, loading, onCardClick }) => {
  const clickable = typeof onCardClick === 'function';
  const cardStyle = clickable
    ? { cursor: 'pointer', transition: 'box-shadow 0.2s', userSelect: 'none' }
    : {};
  const handleClick = (status) => { if (clickable) onCardClick(status); };
  const pieData = [
    { name: 'Pending', value: stats?.pending || 0, color: '#ff8c00' },
    { name: 'Approved', value: stats?.approved || 0, color: '#52c41a' },
    { name: 'Failed', value: stats?.failed || 0, color: '#ff0080' },
  ];

  const barData = [
    { name: 'Total', value: stats?.total || 0, color: '#40e0d0' },
    { name: 'Pending', value: stats?.pending || 0, color: '#ff8c00' },
    { name: 'Approved', value: stats?.approved || 0, color: '#52c41a' },
    { name: 'Failed', value: stats?.failed || 0, color: '#ff0080' },
  ];

  return (
    <>
      <Card loading={loading} className="statistics-card">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-item total" style={cardStyle} onClick={() => handleClick(null)}>
              <div className="stat-icon">
                <TrendingUp size={32} />
              </div>
              <Statistic
                title="Total Admissions"
                value={stats?.total || 0}
                valueStyle={{ color: '#40e0d0', fontSize: '28px', fontWeight: '600' }}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Card className="stat-item pending" style={cardStyle} onClick={() => handleClick('PENDING')}>
              <div className="stat-icon">
                <Clock size={32} />
              </div>
              <Statistic
                title="Pending"
                value={stats?.pending || 0}
                valueStyle={{ color: '#ff8c00', fontSize: '28px', fontWeight: '600' }}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Card className="stat-item confirmed" style={cardStyle} onClick={() => handleClick('APPROVED')}>
              <div className="stat-icon">
                <CheckCircle size={32} />
              </div>
              <Statistic
                title="Approved"
                value={stats?.approved || 0}
                valueStyle={{ color: '#52c41a', fontSize: '28px', fontWeight: '600' }}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Card className="stat-item rejected" style={cardStyle} onClick={() => handleClick('FAILED')}>
              <div className="stat-icon">
                <XCircle size={32} />
              </div>
              <Statistic
                title="Failed"
                value={stats?.failed || 0}
                valueStyle={{ color: '#ff0080', fontSize: '28px', fontWeight: '600' }}
              />
            </Card>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
        <Col xs={24} lg={12}>
          <Card title="Status Distribution" loading={loading} className="chart-card">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Admission Statistics" loading={loading} className="chart-card">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default StatisticsCard;
