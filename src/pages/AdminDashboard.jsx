import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Card, message, DatePicker, Space, Tag, Modal, Form, Input, Select, Table, Dropdown } from 'antd';
import { Users, Download, LogOut, UserPlus, Database, FileText, BarChart3, Menu as MenuIcon, GraduationCap, Plus, Edit, Trash2, BookOpen } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';
import StudentForm from '../components/StudentForm';
import StatisticsCard from '../components/StatisticsCard';
import { adminAPI } from '../services/api';
import logoImage from '../assets/skilledge-logo.png';
import '../App.css';

const { Header, Content, Sider } = Layout;
const { RangePicker } = DatePicker;
const { Option } = Select;

const AdminDashboard = () => {
  const [franchises, setFranchises] = useState([]);
  const [franchiseStats, setFranchiseStats] = useState([]);
  const [students, setStudents] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [courses, setCourses] = useState([]);
  const [fees, setFees] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [dateRange, setDateRange] = useState(null);
  const [selectedFranchise, setSelectedFranchise] = useState(null);
  const [selectedUniversity, setSelectedUniversity] = useState(null);
  const [createFranchiseModal, setCreateFranchiseModal] = useState(false);
  const [createUniversityModal, setCreateUniversityModal] = useState(false);
  const [createCourseModal, setCreateCourseModal] = useState(false);
  const [createFeeModal, setCreateFeeModal] = useState(false);
  const [editingUniversity, setEditingUniversity] = useState(null);
  const [editingCourse, setEditingCourse] = useState(null);
  const [editingFee, setEditingFee] = useState(null);
  const [editingFranchise, setEditingFranchise] = useState(null);
  const [editFranchiseModal, setEditFranchiseModal] = useState(false);
  const [approveModal, setApproveModal] = useState(false);
  const [approvingStudentId, setApprovingStudentId] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [createForm] = Form.useForm();
  const [franchiseForm] = Form.useForm();
  const [universityForm] = Form.useForm();
  const [courseForm] = Form.useForm();
  const [feeForm] = Form.useForm();
  const [commissionForm] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { key: 'statistics', icon: <BarChart3 size={18} />, label: 'Statistics' },
    { key: 'submit-form', icon: <FileText size={18} />, label: 'Submit Form' },
    { key: 'franchises', icon: <Users size={18} />, label: 'Franchises' },
    { key: 'universities', icon: <GraduationCap size={18} />, label: 'Universities' },
    { key: 'courses', icon: <BookOpen size={18} />, label: 'Courses' },
    { key: 'fees', icon: <Database size={18} />, label: 'Fees' },
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

  const loadUniversities = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getUniversities();
      setUniversities(response.data);
      // Also load courses for each university
      const coursesResponse = await adminAPI.getCourses();
      setCourses(coursesResponse.data);
    } catch (error) {
      message.error('Failed to load universities');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUniversity = async (values) => {
    try {
      if (editingUniversity) {
        await adminAPI.updateUniversity(editingUniversity.id, values);
        message.success('University updated successfully!');
      } else {
        await adminAPI.createUniversity(values);
        message.success('University created successfully!');
      }
      setCreateUniversityModal(false);
      setEditingUniversity(null);
      universityForm.resetFields();
      loadUniversities();
    } catch (error) {
      message.error(error.response?.data?.detail || 'Failed to save university');
    }
  };

  const handleEditUniversity = (university) => {
    setEditingUniversity(university);
    universityForm.setFieldsValue(university);
    setCreateUniversityModal(true);
  };

  const handleDeleteUniversity = async (id) => {
    try {
      await adminAPI.deleteUniversity(id);
      message.success('University deleted successfully!');
      loadUniversities();
    } catch (error) {
      message.error(error.response?.data?.detail || 'Failed to delete university');
    }
  };

  const handleToggleUniversityStatus = async (id, currentStatus) => {
    try {
      await adminAPI.updateUniversity(id, { is_active: !currentStatus });
      message.success('University status updated!');
      loadUniversities();
    } catch (error) {
      message.error('Failed to update status');
    }
  };

  const loadCourses = async () => {
    setLoading(true);
    try {
      const params = selectedUniversity ? { university_id: selectedUniversity } : {};
      const response = await adminAPI.getCourses(params);
      setCourses(response.data);
    } catch (error) {
      message.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (values) => {
    try {
      if (editingCourse) {
        await adminAPI.updateCourse(editingCourse.id, values);
        message.success('Course updated successfully!');
      } else {
        await adminAPI.createCourse(values);
        message.success('Course created successfully!');
      }
      setCreateCourseModal(false);
      setEditingCourse(null);
      courseForm.resetFields();
      loadCourses();
    } catch (error) {
      message.error(error.response?.data?.detail || 'Failed to save course');
    }
  };

  const handleEditCourse = (course) => {
    setEditingCourse(course);
    courseForm.setFieldsValue({
      ...course,
      duration_years: course.duration_years.toString()
    });
    setCreateCourseModal(true);
  };

  const handleDeleteCourse = async (id) => {
    try {
      await adminAPI.deleteCourse(id);
      message.success('Course deleted successfully!');
      loadCourses();
    } catch (error) {
      message.error(error.response?.data?.detail || 'Failed to delete course');
    }
  };

  const handleToggleCourseStatus = async (id, currentStatus) => {
    try {
      await adminAPI.updateCourse(id, { is_active: !currentStatus });
      message.success('Course status updated!');
      loadCourses();
    } catch (error) {
      message.error('Failed to update status');
    }
  };

  const loadFees = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getFees();
      setFees(response.data);
    } catch (error) {
      message.error('Failed to load fees');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFee = async (values) => {
    try {
      if (editingFee) {
        await adminAPI.updateFee(editingFee.id, values);
        message.success('Fee structure updated successfully!');
      } else {
        await adminAPI.createFee(values);
        message.success('Fee structure created successfully!');
      }
      setCreateFeeModal(false);
      setEditingFee(null);
      feeForm.resetFields();
      loadFees();
    } catch (error) {
      message.error(error.response?.data?.detail || 'Failed to save fee');
    }
  };

  const handleEditFee = (fee) => {
    setEditingFee(fee);
    feeForm.setFieldsValue(fee);
    setCreateFeeModal(true);
  };

  const handleDeleteFee = async (id) => {
    try {
      await adminAPI.deleteFee(id);
      message.success('Fee deleted successfully!');
      loadFees();
    } catch (error) {
      message.error(error.response?.data?.detail || 'Failed to delete fee');
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
    } else if (location.pathname === '/admin/universities') {
      loadUniversities();
    } else if (location.pathname === '/admin/courses') {
      loadUniversities(); // Load universities for filter
      loadCourses();
    } else if (location.pathname === '/admin/fees') {
      loadCourses(); // Load courses for dropdown
      loadFees();
    }
  }, [location.pathname, dateRange, selectedFranchise, selectedUniversity]);

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

  const handleEditFranchise = (franchise) => {
    setEditingFranchise(franchise);
    franchiseForm.setFieldsValue({
      full_name: franchise.full_name,
      address: franchise.address,
      gst_number: franchise.gst_number,
      pan_number: franchise.pan_number,
      phone_number: franchise.phone_number,
      email: franchise.email,
    });
    setEditFranchiseModal(true);
  };

  const handleUpdateFranchise = async (values) => {
    try {
      // Remove empty password so it doesn't get sent
      if (!values.password) {
        delete values.password;
      }
      await adminAPI.updateFranchise(editingFranchise.id, values);
      message.success('Franchise updated successfully!');
      setEditFranchiseModal(false);
      setEditingFranchise(null);
      franchiseForm.resetFields();
      loadFranchises();
      loadFranchiseStats();
    } catch (error) {
      message.error(error.response?.data?.detail || 'Failed to update franchise');
    }
  };

  const handleDeleteFranchise = async (id) => {
    try {
      await adminAPI.deleteFranchise(id);
      message.success('Franchise deleted successfully!');
      loadFranchises();
      loadFranchiseStats();
    } catch (error) {
      message.error(error.response?.data?.detail || 'Failed to delete franchise');
    }
  };

  const handleToggleFranchiseStatus = async (id, currentStatus) => {
    try {
      await adminAPI.updateFranchise(id, { is_active: !currentStatus });
      message.success('Franchise status updated!');
      loadFranchises();
      loadFranchiseStats();
    } catch (error) {
      message.error('Failed to update status');
    }
  };

  const handleStatusUpdate = async (studentId, newStatus) => {
    try {
      await adminAPI.updateStudentStatus(studentId, { status: newStatus });
      message.success('Status updated successfully!');
      loadStudents();
      loadStatistics();
    } catch (error) {
      message.error('Failed to update status');
    }
  };

  const handleApproveClick = (studentId) => {
    setApprovingStudentId(studentId);
    commissionForm.resetFields();
    setApproveModal(true);
  };

  const handleApproveWithCommission = async (values) => {
    try {
      await adminAPI.updateStudentStatus(approvingStudentId, {
        status: 'APPROVED',
        commission_percentage: parseFloat(values.commission_percentage)
      });
      message.success('Student approved with commission set!');
      setApproveModal(false);
      setApprovingStudentId(null);
      commissionForm.resetFields();
      loadStudents();
      loadStatistics();
    } catch (error) {
      message.error('Failed to approve student');
    }
  };

  const handleUpdateCommission = async (studentId, commissionPercentage) => {
    try {
      await adminAPI.updateStudentCommission(studentId, {
        commission_percentage: parseFloat(commissionPercentage)
      });
      message.success('Commission updated!');
      loadStudents();
    } catch (error) {
      message.error('Failed to update commission');
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
      PENDING: { className: 'status-pending', text: 'Pending' },
      APPROVED: { className: 'status-confirmed', text: 'Approved' },
      FAILED: { className: 'status-rejected', text: 'Failed' },
    };
    const config = map[status] || map.PENDING;
    return <span className={`status-badge ${config.className}`}>{config.text}</span>;
  };

  const studentColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: 'Student Name', key: 'student_name', width: 180, render: (_, record) => `${record.first_name}${record.middle_name ? ' ' + record.middle_name : ''} ${record.last_name}` },
    { title: 'Father Name', dataIndex: 'father_name', key: 'father_name', width: 150 },
    { title: 'Degree', dataIndex: 'degree_type', key: 'degree_type', width: 80, render: (val) => val ? <Tag>{val}</Tag> : '-' },
    { title: 'University', dataIndex: 'university_name', key: 'university_name', width: 150 },
    { title: 'Course', dataIndex: 'course_name', key: 'course_name', width: 150 },
    { title: 'Contact', dataIndex: 'contact_number', key: 'contact_number', width: 120 },
    { title: 'Franchise', dataIndex: 'franchise_name', key: 'franchise_name', width: 130 },
    { title: 'Total Fee', dataIndex: 'total_fee', key: 'total_fee', width: 100, render: (val) => val ? `₹${val}` : '-' },
    { title: 'Commission %', dataIndex: 'commission_percentage', key: 'commission_percentage', width: 110, render: (val) => val ? `${val}%` : '-' },
    { title: 'Commission', dataIndex: 'commission_amount', key: 'commission_amount', width: 110, render: (val) => val ? <Tag color="green">₹{val}</Tag> : '-' },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 100, render: (status) => getStatusBadge(status) },
    { title: 'Submitted', dataIndex: 'created_at', key: 'created_at', width: 110, render: (date) => dayjs(date).format('DD MMM YYYY') },
    {
      title: 'Action',
      key: 'action',
      width: 140,
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              { key: 'APPROVED', label: 'Approve (with Commission)', onClick: () => handleApproveClick(record.id) },
              { key: 'FAILED', label: 'Mark Failed', onClick: () => handleStatusUpdate(record.id, 'FAILED') },
              { key: 'PENDING', label: 'Set Pending', onClick: () => handleStatusUpdate(record.id, 'PENDING') },
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
    { title: 'Phone', dataIndex: 'phone_number', key: 'phone_number', render: (val) => val || '-' },
    { title: 'Email', dataIndex: 'email', key: 'email', render: (val) => val || '-' },
    { title: 'Total', dataIndex: 'total_students', key: 'total_students', render: (val) => <Tag color="blue">{val}</Tag> },
    { title: 'Pending', dataIndex: 'pending', key: 'pending', render: (val) => <Tag color="orange">{val}</Tag> },
    { title: 'Approved', dataIndex: 'approved', key: 'approved', render: (val) => <Tag color="green">{val}</Tag> },
    { title: 'Failed', dataIndex: 'failed', key: 'failed', render: (val) => <Tag color="red">{val}</Tag> },
    { title: 'Status', dataIndex: 'is_active', key: 'is_active', render: (active, record) => (
      <Button
        size="small"
        type={active ? 'primary' : 'default'}
        onClick={() => handleToggleFranchiseStatus(record.id, active)}
      >
        {active ? 'Active' : 'Inactive'}
      </Button>
    )},
    { title: 'Created', dataIndex: 'created_at', key: 'created_at', render: (date) => dayjs(date).format('DD MMM YYYY') },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<Edit size={14} />}
            onClick={() => handleEditFranchise(record)}
          >
            Edit
          </Button>
          <Button
            danger
            size="small"
            icon={<Trash2 size={14} />}
            onClick={() => {
              Modal.confirm({
                title: 'Delete Franchise',
                content: `Are you sure you want to delete ${record.full_name}?`,
                onOk: () => handleDeleteFranchise(record.id)
              });
            }}
          >
            Delete
          </Button>
        </Space>
      )
    }
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
      return <StudentForm userRole="admin" onSuccess={() => { loadStudents(); loadStatistics(); }} />;
    }
    if (location.pathname === '/admin/franchises') {
      return (
        <Card title={`Franchises (${franchiseStats.length})`} extra={<Button type="primary" icon={<UserPlus size={18} />} onClick={() => setCreateFranchiseModal(true)}>Create Franchise</Button>}>
          <Table columns={franchiseColumns} dataSource={franchiseStats} rowKey="id" loading={loading} scroll={{ x: 1400 }} pagination={{ pageSize: 10 }} />
        </Card>
      );
    }
    if (location.pathname === '/admin/universities') {
      const universityColumns = [
        { title: 'Name', dataIndex: 'name', key: 'name' },
        { title: 'Code', dataIndex: 'code', key: 'code' },
        { title: 'Location', dataIndex: 'location', key: 'location' },
        { title: 'Accreditation', dataIndex: 'accreditation', key: 'accreditation' },
        { title: 'Courses', key: 'courses', render: (_, record) => {
          const univCourses = courses.filter(c => c.university_id === record.id);
          return <Tag color="blue">{univCourses.length} courses</Tag>;
        }},
        { title: 'Status', dataIndex: 'is_active', key: 'is_active', render: (active, record) => (
          <Button
            size="small"
            type={active ? 'primary' : 'default'}
            onClick={() => handleToggleUniversityStatus(record.id, active)}
          >
            {active ? 'Active' : 'Inactive'}
          </Button>
        )},
        {
          title: 'Actions',
          key: 'actions',
          width: 200,
          render: (_, record) => (
            <Space>
              <Button
                size="small"
                icon={<Edit size={14} />}
                onClick={() => handleEditUniversity(record)}
              >
                Edit
              </Button>
              <Button
                danger
                size="small"
                icon={<Trash2 size={14} />}
                onClick={() => {
                  Modal.confirm({
                    title: 'Delete University',
                    content: `Are you sure you want to delete ${record.name}?`,
                    onOk: () => handleDeleteUniversity(record.id)
                  });
                }}
              >
                Delete
              </Button>
            </Space>
          )
        }
      ];
      return (
        <Card title={`Universities (${universities.length})`} extra={<Button type="primary" icon={<Plus size={18} />} onClick={() => { setEditingUniversity(null); universityForm.resetFields(); setCreateUniversityModal(true); }}>Add University</Button>}>
          <Table columns={universityColumns} dataSource={universities} rowKey="id" loading={loading} scroll={{ x: 800 }} pagination={{ pageSize: 10 }} />
        </Card>
      );
    }
    if (location.pathname === '/admin/courses') {
      const courseColumns = [
        { title: 'Name', dataIndex: 'name', key: 'name', width: 200 },
        { title: 'Code', dataIndex: 'code', key: 'code', width: 100 },
        { title: 'University', key: 'university', render: (_, record) => record.university?.name || 'N/A', width: 200 },
        { title: 'Duration', dataIndex: 'duration_years', key: 'duration_years', render: (years) => `${years} years`, width: 100 },
        { title: 'Type', dataIndex: 'degree_type', key: 'degree_type', width: 150 },
        { title: 'Status', dataIndex: 'is_active', key: 'is_active', width: 120, render: (active, record) => (
          <Button
            size="small"
            type={active ? 'primary' : 'default'}
            onClick={() => handleToggleCourseStatus(record.id, active)}
          >
            {active ? 'Active' : 'Inactive'}
          </Button>
        )},
        {
          title: 'Actions',
          key: 'actions',
          width: 180,
          render: (_, record) => (
            <Space>
              <Button
                size="small"
                icon={<Edit size={14} />}
                onClick={() => handleEditCourse(record)}
              >
                Edit
              </Button>
              <Button
                danger
                size="small"
                icon={<Trash2 size={14} />}
                onClick={() => {
                  Modal.confirm({
                    title: 'Delete Course',
                    content: `Are you sure you want to delete ${record.name}?`,
                    onOk: () => handleDeleteCourse(record.id)
                  });
                }}
              >
                Delete
              </Button>
            </Space>
          )
        }
      ];
      return (
        <div>
          <Card className="filters-container">
            <Space wrap>
              <span>Filter by university:</span>
              <Select placeholder="All universities" style={{ width: 250 }} value={selectedUniversity} onChange={setSelectedUniversity} allowClear>
                {universities.map(u => <Option key={u.id} value={u.id}>{u.name}</Option>)}
              </Select>
            </Space>
          </Card>
          <Card title={`Courses (${courses.length})`} extra={<Button type="primary" icon={<Plus size={18} />} onClick={() => { setEditingCourse(null); courseForm.resetFields(); setCreateCourseModal(true); }}>Add Course</Button>}>
            <Table columns={courseColumns} dataSource={courses} rowKey="id" loading={loading} scroll={{ x: 1000 }} pagination={{ pageSize: 10 }} />
          </Card>
        </div>
      );
    }
    if (location.pathname === '/admin/fees') {
      const feeColumns = [
        { title: 'Course', key: 'course', render: (_, record) => record.course?.name || 'N/A', width: 200 },
        { title: 'University', key: 'university', render: (_, record) => record.course?.university?.name || 'N/A', width: 200 },
        { title: 'Tuition Fee', dataIndex: 'tuition_fee', key: 'tuition_fee', render: (fee) => `₹${fee}`, width: 120 },
        { title: 'Registration', dataIndex: 'registration_fee', key: 'registration_fee', render: (fee) => `₹${fee}`, width: 120 },
        { title: 'Exam (Yearly)', dataIndex: 'exam_fee_yearly', key: 'exam_fee_yearly', render: (fee) => `₹${fee}`, width: 120 },
        { title: 'Other Fees', dataIndex: 'other_fees', key: 'other_fees', render: (fee) => `₹${fee}`, width: 100 },
        { title: 'Total', dataIndex: 'total_fee', key: 'total_fee', render: (fee) => <Tag color="green">₹{fee}</Tag>, width: 120 },
        { title: 'Academic Year', dataIndex: 'academic_year', key: 'academic_year', width: 130 },
        {
          title: 'Actions',
          key: 'actions',
          width: 180,
          render: (_, record) => (
            <Space>
              <Button
                size="small"
                icon={<Edit size={14} />}
                onClick={() => handleEditFee(record)}
              >
                Edit
              </Button>
              <Button
                danger
                size="small"
                icon={<Trash2 size={14} />}
                onClick={() => {
                  Modal.confirm({
                    title: 'Delete Fee',
                    content: 'Are you sure you want to delete this fee structure?',
                    onOk: () => handleDeleteFee(record.id)
                  });
                }}
              >
                Delete
              </Button>
            </Space>
          )
        }
      ];
      return (
        <Card title={`Fee Structures (${fees.length})`} extra={<Button type="primary" icon={<Plus size={18} />} onClick={() => { setEditingFee(null); feeForm.resetFields(); setCreateFeeModal(true); }}>Add Fee Structure</Button>}>
          <Table columns={feeColumns} dataSource={fees} rowKey="id" loading={loading} scroll={{ x: 1200 }} pagination={{ pageSize: 10 }} />
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
          <Table columns={studentColumns} dataSource={students} rowKey="id" loading={loading} scroll={{ x: 1800 }} pagination={{ pageSize: 10 }} />
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
          <h1 className="dashboard-title">Admin Dashboard</h1>
        </div>
        <Button type="text" icon={<LogOut size={20} />} onClick={handleLogout} className="logout-button">Logout</Button>
      </Header>
      <Layout>
        <div className={`sidebar-backdrop ${mobileOpen ? 'show' : ''}`} onClick={() => setMobileOpen(false)} />
        <Sider width={250} breakpoint="lg" collapsedWidth="0" className={mobileOpen ? 'mobile-open' : ''} onBreakpoint={(broken) => { if (!broken) setMobileOpen(false); }}>
          <Menu
            mode="inline"
            selectedKeys={[
              location.pathname === '/admin/statistics' || location.pathname === '/admin' ? 'statistics' :
              location.pathname === '/admin/submit-form' ? 'submit-form' :
              location.pathname === '/admin/franchises' ? 'franchises' :
              location.pathname === '/admin/universities' ? 'universities' :
              location.pathname === '/admin/courses' ? 'courses' :
              location.pathname === '/admin/fees' ? 'fees' :
              'all-submissions'
            ]}
            items={menuItems}
            onClick={({ key }) => {
              if (key === 'statistics') navigate('/admin/statistics');
              else if (key === 'submit-form') navigate('/admin/submit-form');
              else if (key === 'franchises') navigate('/admin/franchises');
              else if (key === 'universities') navigate('/admin/universities');
              else if (key === 'courses') navigate('/admin/courses');
              else if (key === 'fees') navigate('/admin/fees');
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
          <Form.Item name="phone_number" label="Phone Number">
            <Input placeholder="Enter phone number" />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input placeholder="Enter email" />
          </Form.Item>
          <Form.Item name="address" label="Address">
            <Input.TextArea placeholder="Enter address" rows={2} />
          </Form.Item>
          <Form.Item name="gst_number" label="GST Number">
            <Input placeholder="Enter GST number (15 characters)" maxLength={15} />
          </Form.Item>
          <Form.Item name="pan_number" label="PAN Number">
            <Input placeholder="Enter PAN number (10 characters)" maxLength={10} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">Create Franchise</Button>
              <Button onClick={() => setCreateFranchiseModal(false)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Edit Franchise"
        open={editFranchiseModal}
        onCancel={() => {
          setEditFranchiseModal(false);
          setEditingFranchise(null);
          franchiseForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={franchiseForm} layout="vertical" onFinish={handleUpdateFranchise}>
          <Form.Item name="full_name" label="Full Name" rules={[{ required: true, message: 'Please enter full name' }]}>
            <Input placeholder="Enter full name" />
          </Form.Item>
          <Form.Item name="password" label="Password (leave blank to keep current)">
            <Input.Password placeholder="Enter new password" />
          </Form.Item>
          <Form.Item name="phone_number" label="Phone Number">
            <Input placeholder="Enter phone number" />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input placeholder="Enter email" />
          </Form.Item>
          <Form.Item name="address" label="Address">
            <Input.TextArea placeholder="Enter address" rows={2} />
          </Form.Item>
          <Form.Item name="gst_number" label="GST Number">
            <Input placeholder="Enter GST number (15 characters)" maxLength={15} />
          </Form.Item>
          <Form.Item name="pan_number" label="PAN Number">
            <Input placeholder="Enter PAN number (10 characters)" maxLength={10} />
          </Form.Item>
          <Form.Item name="is_active" label="Status">
            <Select>
              <Option value={true}>Active</Option>
              <Option value={false}>Inactive</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">Update Franchise</Button>
              <Button onClick={() => {
                setEditFranchiseModal(false);
                setEditingFranchise(null);
                franchiseForm.resetFields();
              }}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Approve Student - Set Commission"
        open={approveModal}
        onCancel={() => {
          setApproveModal(false);
          setApprovingStudentId(null);
          commissionForm.resetFields();
        }}
        footer={null}
        width={400}
      >
        <Form form={commissionForm} layout="vertical" onFinish={handleApproveWithCommission}>
          <Form.Item
            name="commission_percentage"
            label="Commission Percentage (%)"
            rules={[{ required: true, message: 'Please enter commission percentage' }]}
          >
            <Input type="number" placeholder="e.g., 15" min={0} max={100} suffix="%" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">Approve & Set Commission</Button>
              <Button onClick={() => {
                setApproveModal(false);
                setApprovingStudentId(null);
                commissionForm.resetFields();
              }}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingUniversity ? "Edit University" : "Add New University"}
        open={createUniversityModal}
        onCancel={() => {
          setCreateUniversityModal(false);
          setEditingUniversity(null);
          universityForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={universityForm} layout="vertical" onFinish={handleCreateUniversity}>
          <Form.Item name="name" label="University Name" rules={[{ required: true, message: 'Please enter university name' }]}>
            <Input placeholder="Enter university name" />
          </Form.Item>
          <Form.Item name="code" label="University Code" rules={[{ required: true, message: 'Please enter university code' }]}>
            <Input placeholder="e.g., DU, IITD" />
          </Form.Item>
          <Form.Item name="location" label="Location">
            <Input placeholder="Enter location" />
          </Form.Item>
          <Form.Item name="accreditation" label="Accreditation">
            <Input placeholder="e.g., NAAC A++" />
          </Form.Item>
          <Form.Item name="is_active" label="Status" initialValue={true} rules={[{ required: true }]}>
            <Select>
              <Option value={true}>Active</Option>
              <Option value={false}>Inactive</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingUniversity ? 'Update University' : 'Add University'}
              </Button>
              <Button onClick={() => {
                setCreateUniversityModal(false);
                setEditingUniversity(null);
                universityForm.resetFields();
              }}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingCourse ? "Edit Course" : "Add New Course"}
        open={createCourseModal}
        onCancel={() => {
          setCreateCourseModal(false);
          setEditingCourse(null);
          courseForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={courseForm} layout="vertical" onFinish={handleCreateCourse}>
          <Form.Item name="university_id" label="University" rules={[{ required: true, message: 'Please select university' }]}>
            <Select placeholder="Select university">
              {universities.map(u => <Option key={u.id} value={u.id}>{u.name}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="name" label="Course Name" rules={[{ required: true, message: 'Please enter course name' }]}>
            <Input placeholder="e.g., Bachelor of Science" />
          </Form.Item>
          <Form.Item name="code" label="Course Code" rules={[{ required: true, message: 'Please enter course code' }]}>
            <Input placeholder="e.g., BSC, BTECH" />
          </Form.Item>
          <Form.Item name="duration_years" label="Duration (Years)" rules={[{ required: true, message: 'Please enter duration' }]}>
            <Input type="number" placeholder="e.g., 3, 4" />
          </Form.Item>
          <Form.Item name="degree_type" label="Degree Type" rules={[{ required: true, message: 'Please select degree type' }]}>
            <Select placeholder="Select degree type">
              <Option value="Undergraduate">Undergraduate</Option>
              <Option value="Postgraduate">Postgraduate</Option>
              <Option value="Diploma">Diploma</Option>
              <Option value="Certificate">Certificate</Option>
            </Select>
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea placeholder="Enter course description" rows={3} />
          </Form.Item>
          <Form.Item name="is_active" label="Status" initialValue={true} rules={[{ required: true }]}>
            <Select>
              <Option value={true}>Active</Option>
              <Option value={false}>Inactive</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingCourse ? 'Update Course' : 'Add Course'}
              </Button>
              <Button onClick={() => {
                setCreateCourseModal(false);
                setEditingCourse(null);
                courseForm.resetFields();
              }}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingFee ? "Edit Fee Structure" : "Add Fee Structure"}
        open={createFeeModal}
        onCancel={() => {
          setCreateFeeModal(false);
          setEditingFee(null);
          feeForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={feeForm} layout="vertical" onFinish={handleCreateFee}>
          <Form.Item name="course_id" label="Course" rules={[{ required: true, message: 'Please select course' }]}>
            <Select placeholder="Select course" showSearch optionFilterProp="children">
              {courses.map(c => <Option key={c.id} value={c.id}>{c.name} - {c.university?.name}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="tuition_fee" label="Tuition Fee" rules={[{ required: true, message: 'Please enter tuition fee' }]}>
            <Input type="number" placeholder="e.g., 50000" prefix="₹" />
          </Form.Item>
          <Form.Item name="registration_fee" label="Registration Fee" rules={[{ required: true, message: 'Please enter registration fee' }]}>
            <Input type="number" placeholder="e.g., 5000" prefix="₹" />
          </Form.Item>
          <Form.Item name="exam_fee_yearly" label="Exam Fee (Yearly)" rules={[{ required: true, message: 'Please enter exam fee' }]}>
            <Input type="number" placeholder="e.g., 3000" prefix="₹" />
          </Form.Item>
          <Form.Item name="other_fees" label="Other Fees">
            <Input type="number" placeholder="e.g., 2000" prefix="₹" />
          </Form.Item>
          <Form.Item name="academic_year" label="Academic Year" rules={[{ required: true, message: 'Please enter academic year' }]}>
            <Input placeholder="e.g., 2024-2025" />
          </Form.Item>
          <Form.Item name="currency" label="Currency" initialValue="INR" rules={[{ required: true }]}>
            <Select>
              <Option value="INR">INR</Option>
              <Option value="USD">USD</Option>
            </Select>
          </Form.Item>
          <Form.Item name="is_active" label="Status" initialValue={true} rules={[{ required: true }]}>
            <Select>
              <Option value={true}>Active</Option>
              <Option value={false}>Inactive</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingFee ? 'Update Fee Structure' : 'Add Fee Structure'}
              </Button>
              <Button onClick={() => {
                setCreateFeeModal(false);
                setEditingFee(null);
                feeForm.resetFields();
              }}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default AdminDashboard;
