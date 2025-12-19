import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Card, message, DatePicker, Space, Tag, Modal, Form, Input, Select, Table, Dropdown } from 'antd';
import { Users, Download, LogOut, UserPlus, Database, FileText, BarChart3, Menu as MenuIcon } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';
import StudentForm from '../components/StudentForm';
import StatisticsCard from '../components/StatisticsCard';
import { adminAPI } from '../services/api';
import '../App.css';

const { Header, Content, Sider } = Layout;
const { RangePicker } = DatePicker;
const { Option } = Select;

const AdminDashboard = () => {
  const [franchises, setFranchises] = useState([]);
  const [franchiseStats, setFranchiseStats] = useState([]);
  const [students, setStudents] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [dateRange, setDateRange] = useState(null);
  const [selectedFranchise, setSelectedFranchise] = useState(null);
  const [createFranchiseModal, setCreateFranchiseModal] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [createForm] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { key: 'statistics', icon: <BarChart3 size={18} />, label: 'Statistics' },
    { key: 'submit-form', icon: <FileText size={18} />, label: 'Submit Form' },
    { key: 'franchises', icon: <Users size={18} />, label: 'Franchises' },
    { key: 'all-submissions', icon: <Database size={18} />, label: 'All Submissions' },
  ];

  const loadFranchises = async () => {
    try {
      const response = await adminAPI.getFranchises();
      setFranchises(response.data);
    } catch (error) {
      message.error('Failed to load franchises');
    }
  };

  const loadFranchiseStats = async () => {
    try {
      const response = await adminAPI.getFranchisesStatistics();
      setFranchiseStats(response.data);
    } catch (error) {
      message.error('Failed to load franchise statistics');
    }
  };

  const loadStatistics = async () => {
    setStatsLoading(true);
    try {
      const response = await adminAPI.getStatistics();
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
      if (selectedFranchise) params.franchise_id = selectedFranchise;
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.start_date = dateRange[0].toISOString();
        params.end_date = dateRange[1].toISOString();
      }
      const response = await adminAPI.getAllStudents(params);
      setStudents(response.data.students);
    } catch (error) {
      message.error('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFranchises();
    loadStatistics();
    loadFranchiseStats();
  }, []);

  useEffect(() => {
    if (location.pathname === '/admin/all-submissions') {
      loadStudents();
    } else if (location.pathname === '/admin/franchises' || location.pathname === '/admin/statistics' || location.pathname === '/admin') {
      loadFranchiseStats();
    }
  }, [location.pathname, dateRange, selectedFranchise]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleCreateFranchise = async (values) => {
    try {
      await adminAPI.createFranchise(values);
      message.success('Franchise created successfully!');
      setCreateFranchiseModal(false);
      createForm.resetFields();
      loadFranchises();
      loadFranchiseStats();
    } catch (error) {
      message.error('Failed to create franchise');
    }
  };

  const handleStatusUpdate = async (studentId, newStatus) => {
    try {
      await adminAPI.updateStudentStatus(studentId, newStatus);
      message.success('Status updated successfully!');
      loadStudents();
      loadStatistics();
    } catch (error) {
      message.error('Failed to update status');
    }
  };

  const handleExportCSV = async () => {
    try {
      const params = {};
      if (selectedFranchise) params.franchise_id = selectedFranchise;
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.start_date = dateRange[0].toISOString();
        params.end_date = dateRange[1].toISOString();
      }
      const response = await adminAPI.exportStudentsCSV(params);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'all_students.csv');
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
      pending: { className: 'status-pending', text: 'Pending' },
      confirmed: { className: 'status-confirmed', text: 'Confirmed' },
      rejected: { className: 'status-rejected', text: 'Rejected' },
    };
    const config = map[status] || map.pending;
    return <span className={`status-badge ${config.className}`}>{config.text}</span>;
  };

  const studentColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: 'Student Name', dataIndex: 'student_name', key: 'student_name', width: 150 },
    { title: 'Father Name', dataIndex: 'father_name', key: 'father_name', width: 150 },
    { title: 'University', dataIndex: 'university_name', key: 'university_name', width: 150 },
    { title: 'Course', dataIndex: 'course_name', key: 'course_name', width: 150 },
    { title: 'Contact', dataIndex: 'contact_number', key: 'contact_number', width: 120 },
    { title: 'Franchise', dataIndex: 'franchise_name', key: 'franchise_name', width: 150 },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 120, render: (status) => getStatusBadge(status) },
    { title: 'Submitted', dataIndex: 'created_at', key: 'created_at', width: 110, render: (date) => dayjs(date).format('DD MMM YYYY') },
    {
      title: 'Action',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              { key: 'confirmed', label: 'Confirm', onClick: () => handleStatusUpdate(record.id, 'confirmed') },
              { key: 'rejected', label: 'Reject', onClick: () => handleStatusUpdate(record.id, 'rejected') },
              { key: 'pending', label: 'Set Pending', onClick: () => handleStatusUpdate(record.id, 'pending') },
            ],
          }}
          placement="bottomRight"
        >
          <Button size="small">Change Status</Button>
        </Dropdown>
      ),
    },
  ];

  const franchiseColumns = [
    { title: 'Franchise Name', dataIndex: 'full_name', key: 'full_name' },
    { title: 'Username', dataIndex: 'username', key: 'username' },
    { title: 'Total', dataIndex: 'total_students', key: 'total_students', render: (val) => <Tag color="blue">{val}</Tag> },
    { title: 'Pending', dataIndex: 'pending', key: 'pending', render: (val) => <Tag color="orange">{val}</Tag> },
    { title: 'Confirmed', dataIndex: 'confirmed', key: 'confirmed', render: (val) => <Tag color="green">{val}</Tag> },
    { title: 'Rejected', dataIndex: 'rejected', key: 'rejected', render: (val) => <Tag color="red">{val}</Tag> },
    { title: 'Status', dataIndex: 'is_active', key: 'is_active', render: (active) => <Tag color={active ? 'success' : 'error'}>{active ? 'Active' : 'Inactive'}</Tag> },
    { title: 'Created', dataIndex: 'created_at', key: 'created_at', render: (date) => dayjs(date).format('DD MMM YYYY') },
  ];

  const renderContent = () => {
    if (location.pathname === '/admin/statistics' || location.pathname === '/admin') {
      return (
        <>
          <StatisticsCard stats={statistics} loading={statsLoading} />
          <Card title="Franchise-wise Statistics">
            <Table columns={franchiseColumns} dataSource={franchiseStats} rowKey="id" loading={loading} scroll={{ x: 800 }} pagination={{ pageSize: 10 }} />
          </Card>
        </>
      );
    }
    if (location.pathname === '/admin/submit-form') {
      return <StudentForm onSuccess={() => { loadStudents(); loadStatistics(); }} />;
    }
    if (location.pathname === '/admin/franchises') {
      return (
        <Card title={`Franchises (${franchiseStats.length})`} extra={<Button type="primary" icon={<UserPlus size={18} />} onClick={() => setCreateFranchiseModal(true)}>Create Franchise</Button>}>
          <Table columns={franchiseColumns} dataSource={franchiseStats} rowKey="id" loading={loading} scroll={{ x: 800 }} pagination={{ pageSize: 10 }} />
        </Card>
      );
    }
    return (
      <div>
        <Card className="filters-container">
          <Space wrap>
            <span>Filter by franchise:</span>
            <Select placeholder="Select franchise" style={{ width: 200 }} value={selectedFranchise} onChange={setSelectedFranchise} allowClear>
              {franchises.map(f => <Option key={f.id} value={f.id}>{f.full_name}</Option>)}
            </Select>
            <span>Filter by date:</span>
            <RangePicker value={dateRange} onChange={setDateRange} format="YYYY-MM-DD" />
            <Button onClick={() => { setSelectedFranchise(null); setDateRange(null); }}>Clear Filters</Button>
          </Space>
        </Card>
        <Card title={`All Submissions (${students.length})`} extra={<Button type="primary" icon={<Download size={18} />} onClick={handleExportCSV}>Export CSV</Button>}>
          <Table columns={studentColumns} dataSource={students} rowKey="id" loading={loading} scroll={{ x: 1200 }} pagination={{ pageSize: 10 }} />
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
        <h1 className="dashboard-title">Admin Dashboard</h1>
        <Button type="text" icon={<LogOut size={20} />} onClick={handleLogout} className="logout-button">Logout</Button>
      </Header>
      <Layout>
        <div className={`sidebar-backdrop ${mobileOpen ? 'show' : ''}`} onClick={() => setMobileOpen(false)} />
        <Sider width={250} breakpoint="lg" collapsedWidth="0" className={mobileOpen ? 'mobile-open' : ''} onBreakpoint={(broken) => { if (!broken) setMobileOpen(false); }}>
          <Menu
            mode="inline"
            selectedKeys={[location.pathname === '/admin/statistics' || location.pathname === '/admin' ? 'statistics' : location.pathname === '/admin/submit-form' ? 'submit-form' : location.pathname === '/admin/franchises' ? 'franchises' : 'all-submissions']}
            items={menuItems}
            onClick={({ key }) => {
              if (key === 'statistics') navigate('/admin/statistics');
              else if (key === 'submit-form') navigate('/admin/submit-form');
              else if (key === 'franchises') navigate('/admin/franchises');
              else if (key === 'all-submissions') navigate('/admin/all-submissions');
              setMobileOpen(false);
            }}
          />
        </Sider>
        <Layout style={{ padding: '0 24px 24px' }}>
          <Content className="dashboard-container">{renderContent()}</Content>
        </Layout>
      </Layout>
      <Button className="mobile-sidebar-toggle" icon={<MenuIcon size={24} color="white" />} onClick={() => setMobileOpen(!mobileOpen)} />
      <Modal title="Create New Franchise" open={createFranchiseModal} onCancel={() => setCreateFranchiseModal(false)} footer={null} width={600}>
        <Form form={createForm} layout="vertical" onFinish={handleCreateFranchise}>
          <Form.Item name="username" label="Username" rules={[{ required: true, message: 'Please enter username' }]}>
            <Input placeholder="Enter username" />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true, message: 'Please enter password' }]}>
            <Input.Password placeholder="Enter password" />
          </Form.Item>
          <Form.Item name="full_name" label="Full Name" rules={[{ required: true, message: 'Please enter full name' }]}>
            <Input placeholder="Enter full name" />
          </Form.Item>
          <Form.Item name="role" label="Role" initialValue="franchise" rules={[{ required: true, message: 'Please select role' }]}>
            <Select><Option value="franchise">Franchise</Option></Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">Create Franchise</Button>
              <Button onClick={() => setCreateFranchiseModal(false)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default AdminDashboard;
