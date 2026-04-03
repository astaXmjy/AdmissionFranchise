import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Card, Table, message, DatePicker, Space, Tag, Select, Modal, Descriptions } from 'antd';
import { FileText, Download, LogOut, Database, BarChart3, Menu as MenuIcon, Eye, Edit, File } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';
import StudentForm from '../components/StudentForm';
import StatisticsCard from '../components/StatisticsCard';
import { franchiseAPI, API_BASE_URL } from '../services/api';
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
  const [statusFilter, setStatusFilter] = useState(null);
  const { Option } = Select;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [viewingStudent, setViewingStudent] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [franchiseName, setFranchiseName] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setFranchiseName(payload.full_name || payload.username || payload.sub || '');
      }
    } catch {}
  }, []);

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
      if (statusFilter) params.status = statusFilter;
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
  }, [location.pathname, dateRange, statusFilter]);

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
    { title: 'Branch', dataIndex: 'branch_name', key: 'branch_name', width: 130, render: (val) => val || '-' },
    { title: 'Specialization', dataIndex: 'branch_specialization', key: 'branch_specialization', width: 140, render: (val) => val || '-' },
    { title: 'Contact', dataIndex: 'contact_number', key: 'contact_number', width: 120 },
    { title: 'Total Fee', dataIndex: 'total_fee', key: 'total_fee', width: 110, render: (val) => val ? `₹${val}` : '-' },
    { title: 'Reg. No.', key: 'registration_number', width: 130, render: (_, record) => record.status === 'APPROVED' && record.registration_number ? <Tag color="green">{record.registration_number}</Tag> : '-' },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 120, render: (status) => getStatusBadge(status) },
    { title: 'Submitted', dataIndex: 'created_at', key: 'created_at', width: 110, render: (date) => dayjs(date).format('DD MMM YYYY') },
    {
      title: 'Action',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<Eye size={14} />} onClick={() => setViewingStudent(record)}>View</Button>
          {record.status === 'PENDING' && (
            <Button size="small" icon={<Edit size={14} />} onClick={() => setEditingStudent(record)}>Edit</Button>
          )}
        </Space>
      ),
    },
  ];

  const renderContent = () => {
    if (location.pathname === '/franchise/statistics' || location.pathname === '/franchise') {
      return (
        <StatisticsCard
          stats={statistics}
          loading={statsLoading}
          onCardClick={(status) => {
            setStatusFilter(status);
            navigate('/franchise/my-submissions');
          }}
        />
      );
    }
    if (location.pathname === '/franchise/submit-form') {
      return <StudentForm userRole="franchise" onSuccess={() => { loadStudents(); loadStatistics(); }} />;
    }
    return (
      <div>
        <Card className="filters-container">
          <Space wrap>
            <span>Filter by status:</span>
            <Select placeholder="All statuses" style={{ width: 150 }} value={statusFilter} onChange={setStatusFilter} allowClear>
              <Option value="PENDING">Pending</Option>
              <Option value="APPROVED">Approved</Option>
              <Option value="FAILED">Failed</Option>
            </Select>
            <span>Filter by date:</span>
            <RangePicker value={dateRange} onChange={setDateRange} format="YYYY-MM-DD" />
            <Button onClick={() => { setStatusFilter(null); setDateRange(null); }}>Clear Filters</Button>
          </Space>
        </Card>
        <Card title={`My Submissions (${students.length})`} extra={<Button type="primary" icon={<Download size={18} />} onClick={handleExportCSV}>Export CSV</Button>}>
          <Table columns={studentColumns} dataSource={students} rowKey="id" loading={loading} scroll={{ x: 1300 }} pagination={{ pageSize: 10 }} />
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
          <h1 className="dashboard-title">
            Franchise Dashboard{franchiseName && <span style={{ marginLeft: '12px', color: 'rgba(255,255,255,0.9)', fontWeight: 700 }}>— {franchiseName}</span>}
          </h1>
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

      {/* View Student Details Modal */}
      <Modal
        title="Student Details"
        open={!!viewingStudent}
        onCancel={() => setViewingStudent(null)}
        footer={<Button onClick={() => setViewingStudent(null)}>Close</Button>}
        width={800}
      >
        {viewingStudent && (
          <>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Student Name" span={2}>
                {`${viewingStudent.first_name}${viewingStudent.middle_name ? ' ' + viewingStudent.middle_name : ''} ${viewingStudent.last_name}`}
              </Descriptions.Item>
              <Descriptions.Item label="Date of Birth">{viewingStudent.dob}</Descriptions.Item>
              <Descriptions.Item label="Email">{viewingStudent.email || '-'}</Descriptions.Item>
              <Descriptions.Item label="Father's Name">{viewingStudent.father_name}</Descriptions.Item>
              <Descriptions.Item label="Mother's Name">{viewingStudent.mother_name}</Descriptions.Item>
            </Descriptions>

            <Descriptions title="Academic Details" bordered column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Degree Type">{viewingStudent.degree_type || '-'}</Descriptions.Item>
              <Descriptions.Item label="University">{viewingStudent.university_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="Course">{viewingStudent.course_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="Course Type">{viewingStudent.course_type || '-'}</Descriptions.Item>
              <Descriptions.Item label="Specialization">{viewingStudent.branch_specialization || '-'}</Descriptions.Item>
              <Descriptions.Item label="Skills">{viewingStudent.skills || '-'}</Descriptions.Item>
              <Descriptions.Item label="APAAR ID">{viewingStudent.apaar_id || '-'}</Descriptions.Item>
              <Descriptions.Item label="Session">{viewingStudent.session || '-'}</Descriptions.Item>
            </Descriptions>

            {viewingStudent.eighth_board && (
              <Descriptions title="8th Class Details" bordered column={2} size="small" style={{ marginBottom: 16 }}>
                <Descriptions.Item label="Board">{viewingStudent.eighth_board === 'Others' ? viewingStudent.eighth_board_other : viewingStudent.eighth_board}</Descriptions.Item>
                <Descriptions.Item label="School">{viewingStudent.eighth_school || '-'}</Descriptions.Item>
                <Descriptions.Item label="Passing Year">{viewingStudent.eighth_passing_year || '-'}</Descriptions.Item>
                <Descriptions.Item label="Percentage">{viewingStudent.eighth_percentage || '-'}</Descriptions.Item>
              </Descriptions>
            )}

            {viewingStudent.tenth_board && (
              <Descriptions title="10th Class Details" bordered column={2} size="small" style={{ marginBottom: 16 }}>
                <Descriptions.Item label="Board">{viewingStudent.tenth_board === 'Others' ? viewingStudent.tenth_board_other : viewingStudent.tenth_board}</Descriptions.Item>
                <Descriptions.Item label="School">{viewingStudent.tenth_school || '-'}</Descriptions.Item>
                <Descriptions.Item label="Passing Year">{viewingStudent.tenth_passing_year || '-'}</Descriptions.Item>
                <Descriptions.Item label="Percentage">{viewingStudent.tenth_percentage || '-'}</Descriptions.Item>
              </Descriptions>
            )}

            {viewingStudent.twelfth_board && (
              <Descriptions title="12th Class Details" bordered column={2} size="small" style={{ marginBottom: 16 }}>
                <Descriptions.Item label="Board">{viewingStudent.twelfth_board === 'Others' ? viewingStudent.twelfth_board_other : viewingStudent.twelfth_board}</Descriptions.Item>
                <Descriptions.Item label="School">{viewingStudent.twelfth_school || '-'}</Descriptions.Item>
                <Descriptions.Item label="Passing Year">{viewingStudent.twelfth_passing_year || '-'}</Descriptions.Item>
                <Descriptions.Item label="Percentage">{viewingStudent.twelfth_percentage || '-'}</Descriptions.Item>
              </Descriptions>
            )}

            {viewingStudent.grad_university && (
              <Descriptions title="Graduation Details" bordered column={2} size="small" style={{ marginBottom: 16 }}>
                <Descriptions.Item label="University">{viewingStudent.grad_university}</Descriptions.Item>
                <Descriptions.Item label="Degree">{viewingStudent.grad_degree || '-'}</Descriptions.Item>
                <Descriptions.Item label="Subject">{viewingStudent.grad_subject || '-'}</Descriptions.Item>
                <Descriptions.Item label="Passing Year">{viewingStudent.grad_passing_year || '-'}</Descriptions.Item>
                <Descriptions.Item label="Percentage">{viewingStudent.grad_percentage || '-'}</Descriptions.Item>
              </Descriptions>
            )}

            <Descriptions title="Contact & Address" bordered column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Contact">{viewingStudent.contact_number}</Descriptions.Item>
              <Descriptions.Item label="Aadhar">{viewingStudent.aadhar_number}</Descriptions.Item>
              <Descriptions.Item label="Street/Locality" span={2}>{viewingStudent.street_locality}</Descriptions.Item>
              <Descriptions.Item label="City">{viewingStudent.city}</Descriptions.Item>
              <Descriptions.Item label="District">{viewingStudent.district || '-'}</Descriptions.Item>
              <Descriptions.Item label="State">{viewingStudent.state}</Descriptions.Item>
              <Descriptions.Item label="Pincode">{viewingStudent.pincode}</Descriptions.Item>
            </Descriptions>

            <Descriptions title="Fee & Status" bordered column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Total Fee">{viewingStudent.total_fee ? `₹${viewingStudent.total_fee}` : '-'}</Descriptions.Item>
              <Descriptions.Item label="Status">{getStatusBadge(viewingStudent.status)}</Descriptions.Item>
              {viewingStudent.status === 'APPROVED' && viewingStudent.registration_number && (
                <Descriptions.Item label="Registration No." span={2}>
                  <Tag color="green" style={{ fontSize: 14, padding: '2px 10px' }}>{viewingStudent.registration_number}</Tag>
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Submitted">{dayjs(viewingStudent.created_at).format('DD MMM YYYY, hh:mm A')}</Descriptions.Item>
            </Descriptions>

            {(viewingStudent.passport_photo || viewingStudent.aadhar_card_doc || viewingStudent.doc_eighth || viewingStudent.doc_tenth || viewingStudent.doc_twelfth || viewingStudent.doc_graduation) && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12, borderBottom: '1px solid #f0f0f0', paddingBottom: 8 }}>Uploaded Documents</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                  {[
                    { key: 'passport_photo', label: 'Passport Photo' },
                    { key: 'aadhar_card_doc', label: 'Aadhar Card' },
                    { key: 'doc_eighth', label: '8th Marksheet' },
                    { key: 'doc_tenth', label: '10th Marksheet' },
                    { key: 'doc_twelfth', label: '12th Marksheet' },
                    { key: 'doc_graduation', label: 'Graduation Certificate' },
                  ].filter(d => viewingStudent[d.key]).map(({ key, label }) => {
                    const url = `${API_BASE_URL}/${viewingStudent[key]}`;
                    const isPdf = viewingStudent[key].endsWith('.pdf');
                    return (
                      <div key={key} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>{label}</div>
                        {isPdf ? (
                          <a href={url} target="_blank" rel="noreferrer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '12px 16px', border: '1px solid #d9d9d9', borderRadius: 6, color: '#1677ff' }}>
                            <File size={32} />
                            <span style={{ fontSize: 11 }}>View PDF</span>
                          </a>
                        ) : (
                          <a href={url} target="_blank" rel="noreferrer">
                            <img src={url} alt={label} style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 6, border: '1px solid #d9d9d9' }} />
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </Modal>

      {/* Edit Student Submission Modal */}
      <Modal
        title="Edit Student Submission"
        open={!!editingStudent}
        onCancel={() => setEditingStudent(null)}
        footer={null}
        width={1000}
        destroyOnClose
      >
        {editingStudent && (
          <StudentForm
            key={editingStudent.id}
            userRole="franchise"
            editData={editingStudent}
            studentId={editingStudent.id}
            onSuccess={() => {
              setEditingStudent(null);
              loadStudents();
            }}
          />
        )}
      </Modal>
    </Layout>
  );
};

export default FranchiseDashboard;
