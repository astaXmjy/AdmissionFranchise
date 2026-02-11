import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Card, Table, message, DatePicker, Space, Tag } from 'antd';
import { FileText, Download, LogOut, Database, BarChart3, Menu as MenuIcon } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';
import StudentForm from '../components/StudentForm';
import StatisticsCard from '../components/StatisticsCard';
import { franchiseAPI } from '../services/api';
import logoImage from '../assets/skilledge-logo.png';
import '../App.css';

const { Header, Content, Sider } = Layout;
const { RangePicker } = DatePicker;

const FranchiseDashboard = () => {
  const [students, setStudents] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [dateRange, setDateRange] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { key: 'statistics', icon: <BarChart3 size={18} />, label: 'Statistics' },
    { key: 'submit-form', icon: <FileText size={18} />, label: 'Submit Form' },
    { key: 'my-submissions', icon: <Database size={18} />, label: 'My Submissions' },
  ];

  const loadStatistics = async () => {
    setStatsLoading(true);
    try {
      const response = await franchiseAPI.getStatistics();
      setStatistics(response.data);
    } catch (error) {
      message.error('Failed to load statistics');
    } finally {
      setStatsLoading(false);
    }
  };

  const loadStudents = async () => {
    setLoading(true);
    try {
      const params = {};
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.start_date = dateRange[0].toISOString();
        params.end_date = dateRange[1].toISOString();
      }
      const response = await franchiseAPI.getMyStudents(params);
      setStudents(response.data.students);
    } catch (error) {
      message.error('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatistics();
  }, []);

  useEffect(() => {
    if (location.pathname === '/franchise/my-submissions') {
      loadStudents();
    }
  }, [location.pathname, dateRange]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleExportCSV = async () => {
    try {
      const params = {};
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.start_date = dateRange[0].toISOString();
        params.end_date = dateRange[1].toISOString();
      }
      const response = await franchiseAPI.exportStudentsCSV(params);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'my_students.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      message.success('CSV exported successfully!');
    } catch (error) {
      message.error('Failed to export CSV');
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      PENDING: { className: 'status-pending', text: 'Pending' },
      APPROVED: { className: 'status-confirmed', text: 'Approved' },
      FAILED: { className: 'status-rejected', text: 'Failed' },
    };
    const config = map[status] || map.PENDING;
    return <span className={`status-badge ${config.className}`}>{config.text}</span>;
  };

  const studentColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: 'Student Name', key: 'student_name', width: 200, render: (_, record) => `${record.first_name}${record.middle_name ? ' ' + record.middle_name : ''} ${record.last_name}` },
    { title: 'Father Name', dataIndex: 'father_name', key: 'father_name', width: 150 },
    { title: 'University', dataIndex: 'university_name', key: 'university_name', width: 150 },
    { title: 'Course', dataIndex: 'course_name', key: 'course_name', width: 150 },
    { title: 'Contact', dataIndex: 'contact_number', key: 'contact_number', width: 120 },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 120, render: (status) => getStatusBadge(status) },
    { title: 'Submitted', dataIndex: 'created_at', key: 'created_at', width: 110, render: (date) => dayjs(date).format('DD MMM YYYY') },
  ];

  const renderContent = () => {
    if (location.pathname === '/franchise/statistics' || location.pathname === '/franchise') {
      return <StatisticsCard stats={statistics} loading={statsLoading} />;
    }
    if (location.pathname === '/franchise/submit-form') {
      return <StudentForm userRole="franchise" onSuccess={() => { loadStudents(); loadStatistics(); }} />;
    }
    return (
      <div>
        <Card className="filters-container">
          <Space wrap>
            <span>Filter by date:</span>
            <RangePicker value={dateRange} onChange={setDateRange} format="YYYY-MM-DD" />
            <Button onClick={() => setDateRange(null)}>Clear Filters</Button>
          </Space>
        </Card>
        <Card title={`My Submissions (${students.length})`} extra={<Button type="primary" icon={<Download size={18} />} onClick={handleExportCSV}>Export CSV</Button>}>
          <Table columns={studentColumns} dataSource={students} rowKey="id" loading={loading} scroll={{ x: 1000 }} pagination={{ pageSize: 10 }} />
        </Card>
      </div>
    );
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header className="dashboard-header">
        <button className="header-menu-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
          <MenuIcon size={24} />
        </button>
        <div className="header-logo-title">
          <img src={logoImage} alt="Skilledge" className="navbar-logo" />
          <h1 className="dashboard-title">Franchise Dashboard</h1>
        </div>
        <Button type="text" icon={<LogOut size={20} />} onClick={handleLogout} className="logout-button">Logout</Button>
      </Header>
      <Layout>
        <div className={`sidebar-backdrop ${mobileOpen ? 'show' : ''}`} onClick={() => setMobileOpen(false)} />
        <Sider width={250} breakpoint="lg" collapsedWidth="0" className={mobileOpen ? 'mobile-open' : ''} onBreakpoint={(broken) => { if (!broken) setMobileOpen(false); }}>
          <Menu
            mode="inline"
            selectedKeys={[location.pathname === '/franchise/statistics' || location.pathname === '/franchise' ? 'statistics' : location.pathname === '/franchise/submit-form' ? 'submit-form' : 'my-submissions']}
            items={menuItems}
            onClick={({ key }) => {
              if (key === 'statistics') navigate('/franchise/statistics');
              else if (key === 'submit-form') navigate('/franchise/submit-form');
              else if (key === 'my-submissions') navigate('/franchise/my-submissions');
              setMobileOpen(false);
            }}
          />
        </Sider>
        <Layout style={{ padding: '0 24px 24px' }}>
          <Content className="dashboard-container">{renderContent()}</Content>
        </Layout>
      </Layout>
      <Button className="mobile-sidebar-toggle" icon={<MenuIcon size={24} color="white" />} onClick={() => setMobileOpen(!mobileOpen)} />
    </Layout>
  );
};

export default FranchiseDashboard;
