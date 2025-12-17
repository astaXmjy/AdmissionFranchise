import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Row, Col } from 'antd';
import { User, Home, BookOpen, Phone, Mail, MapPin, Hash, GraduationCap } from 'lucide-react';
import { franchiseAPI } from '../services/api';

const StudentForm = ({ onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await franchiseAPI.createStudent(values);
      message.success('Student admission form submitted successfully!');
      form.resetFields();
      if (onSuccess) onSuccess();
    } catch (error) {
      message.error('Failed to submit form. Please try again.');
      console.error('Form submission error:', error);
    } finally {
      setLoading(false);
    }
  };

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
            <Col xs={24}>
              <Form.Item
                name="student_name"
                label="Student Name"
                rules={[{ required: true, message: 'Please enter student name' }]}
              >
                <Input
                  prefix={<User size={16} />}
                  placeholder="Enter full name"
                  size="large"
                />
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
                rules={[{ required: true, message: 'Please enter father\'s name' }]}
              >
                <Input
                  prefix={<User size={16} />}
                  placeholder="Enter father's name"
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="mother_name"
                label="Mother's Name"
                rules={[{ required: true, message: 'Please enter mother\'s name' }]}
              >
                <Input
                  prefix={<User size={16} />}
                  placeholder="Enter mother's name"
                  size="large"
                />
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
                name="previous_class"
                label="Previous Class"
                rules={[{ required: true, message: 'Please enter previous class' }]}
              >
                <Input
                  prefix={<BookOpen size={16} />}
                  placeholder="e.g., 10th, 12th"
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="course_applied"
                label="Course Applied For"
                rules={[{ required: true, message: 'Please enter course applied for' }]}
              >
                <Input
                  prefix={<GraduationCap size={16} />}
                  placeholder="e.g., B.Tech, MBA"
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="branch_specialization"
                label="Branch/Specialization"
              >
                <Input
                  prefix={<BookOpen size={16} />}
                  placeholder="Optional"
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24}>
              <Form.Item
                name="affiliating_university"
                label="Affiliating University (if applicable)"
              >
                <Input
                  prefix={<GraduationCap size={16} />}
                  placeholder="Optional"
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>
        </div>

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
                <Input
                  prefix={<MapPin size={16} />}
                  placeholder="Enter street address"
                  size="large"
                />
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
                <Input
                  prefix={<MapPin size={16} />}
                  placeholder="Enter city"
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="state"
                label="State"
                rules={[{ required: true, message: 'Please enter state' }]}
              >
                <Input
                  prefix={<MapPin size={16} />}
                  placeholder="Enter state"
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="pincode"
                label="Pincode"
                rules={[{ required: true, message: 'Please enter pincode' }]}
              >
                <Input
                  prefix={<Hash size={16} />}
                  placeholder="Enter pincode"
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="contact_number"
                label="Contact Number"
                rules={[{ required: true, message: 'Please enter contact number' }]}
              >
                <Input
                  prefix={<Phone size={16} />}
                  placeholder="Enter contact number"
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="aadhar_number"
                label="Aadhar Number"
                rules={[
                  { required: true, message: 'Please enter Aadhar number' },
                  { len: 12, message: 'Aadhar number must be 12 digits' },
                  { pattern: /^\d{12}$/, message: 'Aadhar number must contain only digits' }
                ]}
              >
                <Input
                  prefix={<Hash size={16} />}
                  placeholder="Enter 12-digit Aadhar number"
                  size="large"
                />
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
