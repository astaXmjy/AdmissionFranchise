import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message, Row, Col, Select, DatePicker } from 'antd';
import { User, Home, BookOpen, Phone, MapPin, Hash, GraduationCap, Mail } from 'lucide-react';
import { franchiseAPI, adminAPI } from '../services/api';

const { Option } = Select;

const StudentForm = ({ onSuccess, userRole }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [universities, setUniversities] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loadingUniversities, setLoadingUniversities] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [degreeType, setDegreeType] = useState(null);

  const isAdmin = userRole === 'admin';

  useEffect(() => {
    fetchUniversities();
  }, []);

  const fetchUniversities = async () => {
    setLoadingUniversities(true);
    try {
      const response = isAdmin
        ? await adminAPI.getUniversitiesSelect()
        : await franchiseAPI.getUniversities();
      setUniversities(response.data || []);
    } catch (error) {
      message.error('Failed to load universities');
    } finally {
      setLoadingUniversities(false);
    }
  };

  const fetchCourses = async (universityId, selectedDegreeType) => {
    setLoadingCourses(true);
    setCourses([]);
    form.setFieldsValue({ course_id: undefined });

    try {
      const response = isAdmin
        ? await adminAPI.getCoursesSelect(universityId, selectedDegreeType)
        : await franchiseAPI.getCoursesByUniversity(universityId, selectedDegreeType);
      setCourses(response.data || []);
    } catch (error) {
      message.error('Failed to load courses');
    } finally {
      setLoadingCourses(false);
    }
  };

  const onUniversityChange = (universityId) => {
    if (universityId && degreeType) {
      fetchCourses(universityId, degreeType);
    } else {
      setCourses([]);
      form.setFieldsValue({ course_id: undefined });
    }
  };

  const onDegreeTypeChange = (value) => {
    setDegreeType(value);
    // Reset courses and re-fetch if university is selected
    setCourses([]);
    form.setFieldsValue({ course_id: undefined });
    const universityId = form.getFieldValue('university_id');
    if (universityId && value) {
      fetchCourses(universityId, value);
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // Combine skills array + custom skill into comma-separated string
      let skillsList = (values.skills || []).filter(s => s !== 'Others');
      if (values.skills_other) {
        skillsList.push(values.skills_other);
      }
      const { skills_other, ...rest } = values;
      const payload = {
        ...rest,
        skills: skillsList.length > 0 ? skillsList.join(', ') : null,
        dob: values.dob ? values.dob.format('YYYY-MM-DD') : undefined,
      };
      await franchiseAPI.createStudent(payload);
      message.success('Student admission form submitted successfully!');
      form.resetFields();
      setCourses([]);
      setDegreeType(null);
      if (onSuccess) onSuccess();
    } catch (error) {
      message.error(error.response?.data?.detail || 'Failed to submit form. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const tenthBoardValue = Form.useWatch('tenth_board', form);
  const twelfthBoardValue = Form.useWatch('twelfth_board', form);
  const skillsValue = Form.useWatch('skills', form) || [];

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <GraduationCap size={24} />
          <span>Online Admission Form</span>
        </div>
      }
      className="student-form-card"
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        autoComplete="off"
      >
        {/* Student Details Section */}
        <div className="form-section">
          <h3>
            <User size={20} style={{ marginRight: '8px' }} />
            Student Details
          </h3>
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item
                name="first_name"
                label="First Name"
                rules={[{ required: true, message: 'Please enter first name' }]}
              >
                <Input prefix={<User size={16} />} placeholder="Enter first name" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="middle_name" label="Middle Name">
                <Input prefix={<User size={16} />} placeholder="Enter middle name" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="last_name"
                label="Last Name"
                rules={[{ required: true, message: 'Please enter last name' }]}
              >
                <Input prefix={<User size={16} />} placeholder="Enter last name" size="large" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item
                name="dob"
                label="Date of Birth"
                rules={[{ required: true, message: 'Please select date of birth' }]}
              >
                <DatePicker style={{ width: '100%' }} size="large" format="DD-MM-YYYY" placeholder="Select date of birth" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="email"
                label="Email ID (Optional)"
                rules={[{ type: 'email', message: 'Please enter a valid email' }]}
              >
                <Input prefix={<Mail size={16} />} placeholder="Enter email address" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="contact_number"
                label="Phone Number"
                rules={[{ required: true, message: 'Please enter phone number' }]}
              >
                <Input prefix={<Phone size={16} />} placeholder="Enter phone number" size="large" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item
                name="aadhar_number"
                label="Aadhar Number"
                rules={[
                  { required: true, message: 'Please enter Aadhar number' },
                  { len: 12, message: 'Aadhar number must be 12 digits' },
                  { pattern: /^\d{12}$/, message: 'Aadhar number must contain only digits' }
                ]}
              >
                <Input prefix={<Hash size={16} />} placeholder="Enter 12-digit Aadhar number" size="large" />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* Family Details Section */}
        <div className="form-section">
          <h3>
            <User size={20} style={{ marginRight: '8px' }} />
            Family Details
          </h3>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="father_name"
                label="Father's Name"
                rules={[{ required: true, message: "Please enter father's name" }]}
              >
                <Input prefix={<User size={16} />} placeholder="Enter father's name" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="mother_name"
                label="Mother's Name"
                rules={[{ required: true, message: "Please enter mother's name" }]}
              >
                <Input prefix={<User size={16} />} placeholder="Enter mother's name" size="large" />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* Academic Details Section */}
        <div className="form-section">
          <h3>
            <BookOpen size={20} style={{ marginRight: '8px' }} />
            Academic Details
          </h3>
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item
                name="degree_type"
                label="Degree Type"
                rules={[{ required: true, message: 'Please select degree type' }]}
              >
                <Select placeholder="Select degree type" size="large" onChange={onDegreeTypeChange}>
                  <Option value="UG">UG (Undergraduate)</Option>
                  <Option value="PG">PG (Postgraduate)</Option>
                  <Option value="Diploma">Diploma</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="university_id"
                label="University"
                rules={[{ required: true, message: 'Please select university' }]}
              >
                <Select
                  placeholder="Select university"
                  size="large"
                  loading={loadingUniversities}
                  onChange={onUniversityChange}
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    option.children.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {universities.map(univ => (
                    <Option key={univ.id} value={univ.id}>
                      {univ.name} {univ.code && `(${univ.code})`}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="course_id"
                label="Course"
                rules={[{ required: true, message: 'Please select course' }]}
              >
                <Select
                  placeholder={degreeType ? "Select course" : "Select degree type first"}
                  size="large"
                  loading={loadingCourses}
                  disabled={courses.length === 0}
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    option.children.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {courses.map(course => (
                    <Option key={course.id} value={course.id}>
                      {course.name} {course.code && `(${course.code})`}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="branch_specialization" label="Branch/Specialization (Optional)">
                <Input prefix={<BookOpen size={16} />} placeholder="Enter branch or specialization" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="skills" label="Skills (Optional)">
                <Select
                  mode="multiple"
                  placeholder="Select skills"
                  size="large"
                  allowClear
                >
                  <Option value="Computer Skills">Computer Skills</Option>
                  <Option value="MS Office">MS Office</Option>
                  <Option value="MS Excel">MS Excel</Option>
                  <Option value="MS Word">MS Word</Option>
                  <Option value="MS PowerPoint">MS PowerPoint</Option>
                  <Option value="Tally">Tally</Option>
                  <Option value="Tally Prime">Tally Prime</Option>
                  <Option value="Communication Skills">Communication Skills</Option>
                  <Option value="English Speaking">English Speaking</Option>
                  <Option value="Hindi Typing">Hindi Typing</Option>
                  <Option value="English Typing">English Typing</Option>
                  <Option value="Programming">Programming</Option>
                  <Option value="Python">Python</Option>
                  <Option value="Java">Java</Option>
                  <Option value="C/C++">C/C++</Option>
                  <Option value="Web Development">Web Development</Option>
                  <Option value="Data Entry">Data Entry</Option>
                  <Option value="Digital Marketing">Digital Marketing</Option>
                  <Option value="SEO">SEO</Option>
                  <Option value="Social Media Marketing">Social Media Marketing</Option>
                  <Option value="Graphic Design">Graphic Design</Option>
                  <Option value="Photoshop">Photoshop</Option>
                  <Option value="CorelDraw">CorelDraw</Option>
                  <Option value="Video Editing">Video Editing</Option>
                  <Option value="Accounting">Accounting</Option>
                  <Option value="GST Filing">GST Filing</Option>
                  <Option value="Financial Management">Financial Management</Option>
                  <Option value="AutoCAD">AutoCAD</Option>
                  <Option value="Hardware & Networking">Hardware & Networking</Option>
                  <Option value="Cyber Security">Cyber Security</Option>
                  <Option value="Cloud Computing">Cloud Computing</Option>
                  <Option value="AI/Machine Learning">AI/Machine Learning</Option>
                  <Option value="Data Analytics">Data Analytics</Option>
                  <Option value="Database Management">Database Management</Option>
                  <Option value="Leadership">Leadership</Option>
                  <Option value="Team Management">Team Management</Option>
                  <Option value="Problem Solving">Problem Solving</Option>
                  <Option value="Others">Others</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          {skillsValue.includes('Others') && (
            <Row gutter={16}>
              <Col xs={24} sm={12} offset={12}>
                <Form.Item
                  name="skills_other"
                  label="Other Skill"
                  rules={[{ required: true, message: 'Please enter your skill' }]}
                >
                  <Input placeholder="Enter your skill" size="large" />
                </Form.Item>
              </Col>
            </Row>
          )}
        </div>

        {/* 10th Details — shown for ALL degree types */}
        {degreeType && (
          <div className="form-section">
            <h3>
              <BookOpen size={20} style={{ marginRight: '8px' }} />
              10th Class Details
            </h3>
            <Row gutter={16}>
              <Col xs={24} sm={8}>
                <Form.Item
                  name="tenth_board"
                  label="Board"
                  rules={[{ required: true, message: 'Please select board' }]}
                >
                  <Select placeholder="Select board" size="large">
                    <Option value="MP Board">MP Board</Option>
                    <Option value="CBSE">CBSE</Option>
                    <Option value="Others">Others</Option>
                  </Select>
                </Form.Item>
              </Col>
              {tenthBoardValue === 'Others' && (
                <Col xs={24} sm={8}>
                  <Form.Item
                    name="tenth_board_other"
                    label="Board Name"
                    rules={[{ required: true, message: 'Please enter board name' }]}
                  >
                    <Input placeholder="Enter board name" size="large" />
                  </Form.Item>
                </Col>
              )}
              <Col xs={24} sm={8}>
                <Form.Item
                  name="tenth_school"
                  label="School Name"
                  rules={[{ required: true, message: 'Please enter school name' }]}
                >
                  <Input placeholder="Enter school name" size="large" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col xs={24} sm={8}>
                <Form.Item
                  name="tenth_passing_year"
                  label="Passing Year"
                  rules={[{ required: true, message: 'Please enter passing year' }]}
                >
                  <Input placeholder="e.g., 2020" size="large" maxLength={4} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item
                  name="tenth_percentage"
                  label="Percentage / CGPA"
                  rules={[{ required: true, message: 'Please enter percentage' }]}
                >
                  <Input placeholder="e.g., 85.5%" size="large" />
                </Form.Item>
              </Col>
            </Row>
          </div>
        )}

        {/* 12th Details — shown for UG and PG */}
        {(degreeType === 'UG' || degreeType === 'PG') && (
          <div className="form-section">
            <h3>
              <BookOpen size={20} style={{ marginRight: '8px' }} />
              12th Class Details
            </h3>
            <Row gutter={16}>
              <Col xs={24} sm={8}>
                <Form.Item
                  name="twelfth_board"
                  label="Board"
                  rules={[{ required: true, message: 'Please select board' }]}
                >
                  <Select placeholder="Select board" size="large">
                    <Option value="MP Board">MP Board</Option>
                    <Option value="CBSE">CBSE</Option>
                    <Option value="Others">Others</Option>
                  </Select>
                </Form.Item>
              </Col>
              {twelfthBoardValue === 'Others' && (
                <Col xs={24} sm={8}>
                  <Form.Item
                    name="twelfth_board_other"
                    label="Board Name"
                    rules={[{ required: true, message: 'Please enter board name' }]}
                  >
                    <Input placeholder="Enter board name" size="large" />
                  </Form.Item>
                </Col>
              )}
              <Col xs={24} sm={8}>
                <Form.Item
                  name="twelfth_school"
                  label="School Name"
                  rules={[{ required: true, message: 'Please enter school name' }]}
                >
                  <Input placeholder="Enter school name" size="large" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col xs={24} sm={8}>
                <Form.Item
                  name="twelfth_passing_year"
                  label="Passing Year"
                  rules={[{ required: true, message: 'Please enter passing year' }]}
                >
                  <Input placeholder="e.g., 2022" size="large" maxLength={4} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item
                  name="twelfth_percentage"
                  label="Percentage / CGPA"
                  rules={[{ required: true, message: 'Please enter percentage' }]}
                >
                  <Input placeholder="e.g., 78.3%" size="large" />
                </Form.Item>
              </Col>
            </Row>
          </div>
        )}

        {/* Graduation Details — shown for PG only */}
        {degreeType === 'PG' && (
          <div className="form-section">
            <h3>
              <GraduationCap size={20} style={{ marginRight: '8px' }} />
              Graduation Details
            </h3>
            <Row gutter={16}>
              <Col xs={24} sm={8}>
                <Form.Item
                  name="grad_university"
                  label="University"
                  rules={[{ required: true, message: 'Please enter university' }]}
                >
                  <Input placeholder="Enter graduation university" size="large" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item
                  name="grad_degree"
                  label="Degree"
                  rules={[{ required: true, message: 'Please enter degree' }]}
                >
                  <Input placeholder="e.g., B.Sc, B.Com" size="large" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item
                  name="grad_subject"
                  label="Subject / Major"
                  rules={[{ required: true, message: 'Please enter subject' }]}
                >
                  <Input placeholder="e.g., Computer Science" size="large" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col xs={24} sm={8}>
                <Form.Item
                  name="grad_passing_year"
                  label="Passing Year"
                  rules={[{ required: true, message: 'Please enter passing year' }]}
                >
                  <Input placeholder="e.g., 2024" size="large" maxLength={4} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item
                  name="grad_percentage"
                  label="Percentage / CGPA"
                  rules={[{ required: true, message: 'Please enter percentage' }]}
                >
                  <Input placeholder="e.g., 72.5%" size="large" />
                </Form.Item>
              </Col>
            </Row>
          </div>
        )}

        {/* Contact & Address Section */}
        <div className="form-section">
          <h3>
            <Home size={20} style={{ marginRight: '8px' }} />
            Contact & Address
          </h3>
          <Row gutter={16}>
            <Col xs={24}>
              <Form.Item
                name="street_locality"
                label="Street/Locality"
                rules={[{ required: true, message: 'Please enter street/locality' }]}
              >
                <Input prefix={<MapPin size={16} />} placeholder="Enter street address" size="large" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item
                name="city"
                label="City"
                rules={[{ required: true, message: 'Please enter city' }]}
              >
                <Input prefix={<MapPin size={16} />} placeholder="Enter city" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="state"
                label="State"
                rules={[{ required: true, message: 'Please enter state' }]}
              >
                <Input prefix={<MapPin size={16} />} placeholder="Enter state" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="pincode"
                label="Pincode"
                rules={[{ required: true, message: 'Please enter pincode' }]}
              >
                <Input prefix={<Hash size={16} />} placeholder="Enter pincode" size="large" />
              </Form.Item>
            </Col>
          </Row>
        </div>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} size="large" block className="submit-button">
            Submit Admission Form
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default StudentForm;
