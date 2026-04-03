import React, { useState, useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import { Form, Input, Button, Card, message, Alert, Row, Col, Select, DatePicker, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { User, Home, BookOpen, Phone, MapPin, Hash, GraduationCap, Mail, FileText, Printer } from 'lucide-react';
import { franchiseAPI, adminAPI } from '../services/api';

const { Option } = Select;

const KNOWN_SKILLS = [
  'Computer Skills','MS Office','MS Excel','MS Word','MS PowerPoint','Tally','Tally Prime',
  'Communication Skills','English Speaking','Hindi Typing','English Typing','Programming',
  'Python','Java','C/C++','Web Development','Data Entry','Digital Marketing','SEO',
  'Social Media Marketing','Graphic Design','Photoshop','CorelDraw','Video Editing',
  'Accounting','GST Filing','Financial Management','AutoCAD','Hardware & Networking',
  'Cyber Security','Cloud Computing','AI/Machine Learning','Data Analytics',
  'Database Management','Leadership','Team Management','Problem Solving','Economics',
  'English Literature','Hindi Literature','Political Science','Sociology',
];

const StudentForm = ({ onSuccess, userRole, editData, studentId }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [universities, setUniversities] = useState([]);
  const [courses, setCourses] = useState([]);
  const [franchises, setFranchises] = useState([]);
  const [loadingUniversities, setLoadingUniversities] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [degreeType, setDegreeType] = useState(null);
  const [allowedDegreeTypes, setAllowedDegreeTypes] = useState(null); // null = no restriction (admin)
  const [selectedCourse, setSelectedCourse] = useState(null); // full course object with variants & eligible_education
  const [selectedBranch, setSelectedBranch] = useState(null); // selected branch object
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [feeDetails, setFeeDetails] = useState(null);
  const [loadingFee, setLoadingFee] = useState(false);
  const [submitAlert, setSubmitAlert] = useState(null);
  const [printData, setPrintData] = useState(null);
  const [passportPhotoFile, setPassportPhotoFile] = useState(null);
  const [aadharCardFile, setAadharCardFile] = useState(null);
  const [docEighthFile, setDocEighthFile] = useState(null);
  const [docTenthFile, setDocTenthFile] = useState(null);
  const [docTwelfthFile, setDocTwelfthFile] = useState(null);
  const [docGraduationFile, setDocGraduationFile] = useState(null);
  const editInitialized = useRef(false); // { type: 'success' | 'error', message: string }

  const isAdmin = userRole === 'admin';

  const initializeEditForm = async (data) => {
    // Parse skills: split comma-separated, separate known vs custom
    const skillsList = data.skills ? data.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
    const standardSkills = skillsList.filter(s => KNOWN_SKILLS.includes(s));
    const customSkill = skillsList.find(s => !KNOWN_SKILLS.includes(s));
    if (customSkill) standardSkills.push('Others');

    // Parse branch_specialization: if not a known option it was a custom "Others" value
    const knownSpecs = ['NA', 'Others'];
    let specValue = data.branch_specialization || undefined;
    let specOther;
    if (specValue && !knownSpecs.includes(specValue)) {
      specOther = specValue;
      specValue = 'Others';
    }

    // Set all non-dependent fields immediately
    form.setFieldsValue({
      first_name: data.first_name,
      middle_name: data.middle_name,
      last_name: data.last_name,
      dob: data.dob ? dayjs(data.dob) : undefined,
      email: data.email,
      contact_number: data.contact_number,
      aadhar_number: data.aadhar_number,
      apaar_id: data.apaar_id,
      session: data.session,
      father_name: data.father_name,
      mother_name: data.mother_name,
      degree_type: data.degree_type,
      university_id: data.university_id,
      branch_specialization: specValue,
      branch_specialization_other: specOther,
      skills: standardSkills.length > 0 ? standardSkills : undefined,
      skills_other: customSkill,
      tenth_board: data.tenth_board,
      tenth_board_other: data.tenth_board_other,
      tenth_school: data.tenth_school,
      tenth_passing_year: data.tenth_passing_year,
      tenth_percentage: data.tenth_percentage,
      twelfth_board: data.twelfth_board,
      twelfth_board_other: data.twelfth_board_other,
      twelfth_school: data.twelfth_school,
      twelfth_passing_year: data.twelfth_passing_year,
      twelfth_percentage: data.twelfth_percentage,
      grad_university: data.grad_university,
      grad_degree: data.grad_degree,
      grad_subject: data.grad_subject,
      grad_passing_year: data.grad_passing_year,
      grad_percentage: data.grad_percentage,
      street_locality: data.street_locality,
      city: data.city,
      district: data.district,
      state: data.state,
      pincode: data.pincode,
      franchise_id: data.franchise_id,
    });

    setDegreeType(data.degree_type);

    // Load courses then set course/branch/variant
    if (data.university_id && data.degree_type) {
      const coursesList = await fetchCourses(data.university_id, data.degree_type);

      // Always restore these values — fetchCourses clears them
      form.setFieldsValue({
        course_id: data.course_id || undefined,
        branch_id: data.branch_id || undefined,
        course_variant_id: data.course_variant_id || undefined,
      });

      const course = coursesList.find(c => c.id === data.course_id);
      if (course) {
        setSelectedCourse(course);

        if (data.branch_id) {
          const branch = course.branches?.find(b => b.id === data.branch_id);
          if (branch) setSelectedBranch(branch);
        }

        if (data.course_variant_id) {
          setSelectedVariantId(data.course_variant_id);
          setLoadingFee(true);
          try {
            const feeResp = isAdmin
              ? await adminAPI.getFeeByVariant(data.course_variant_id)
              : await franchiseAPI.getFeeByVariant(data.course_variant_id);
            const fees = feeResp.data;
            setFeeDetails(Array.isArray(fees) ? fees[0] : fees || null);
          } catch {
            setFeeDetails(null);
          } finally {
            setLoadingFee(false);
          }
        }
      }
    }
  };

  useEffect(() => {
    if (editData && universities.length > 0 && !editInitialized.current) {
      editInitialized.current = true;
      initializeEditForm(editData);
    }
  }, [editData, universities]);

  useEffect(() => {
    if (!isAdmin) {
      franchiseAPI.getMyDegreeTypes()
        .then(res => setAllowedDegreeTypes(res.data || null))
        .catch(() => {});
    }
    if (editData?.degree_type) {
      fetchUniversities(editData.degree_type);
    }
    if (isAdmin) {
      adminAPI.getFranchises().then(res => setFranchises(res.data || [])).catch(() => {});
    }
  }, []);

  const fetchUniversities = async (degreeTypeFilter) => {
    setLoadingUniversities(true);
    try {
      const response = isAdmin
        ? await adminAPI.getUniversitiesSelect(degreeTypeFilter)
        : await franchiseAPI.getUniversities(degreeTypeFilter);
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
    setSelectedCourse(null);
    setSelectedBranch(null);
    setSelectedVariantId(null);
    form.setFieldsValue({ course_id: undefined, branch_id: undefined, course_variant_id: undefined });

    try {
      const response = isAdmin
        ? await adminAPI.getCoursesSelect(universityId, selectedDegreeType)
        : await franchiseAPI.getCoursesByUniversity(universityId, selectedDegreeType);
      const data = response.data || [];
      setCourses(data);
      return data;
    } catch (error) {
      message.error('Failed to load courses');
      return [];
    } finally {
      setLoadingCourses(false);
    }
  };

  const onUniversityChange = (universityId) => {
    setSelectedCourse(null);
    setSelectedBranch(null);
    setSelectedVariantId(null);
    setFeeDetails(null);
    form.setFieldsValue({ course_id: undefined, branch_id: undefined, course_variant_id: undefined });
    if (universityId && degreeType) {
      fetchCourses(universityId, degreeType);
    } else {
      setCourses([]);
    }
  };

  const onDegreeTypeChange = (value) => {
    setDegreeType(value);
    setUniversities([]);
    setCourses([]);
    setSelectedCourse(null);
    setSelectedBranch(null);
    setSelectedVariantId(null);
    setFeeDetails(null);
    form.setFieldsValue({ university_id: undefined, course_id: undefined, branch_id: undefined, course_variant_id: undefined });
    if (value) {
      fetchUniversities(value);
    }
  };

  const onCourseChange = (courseId) => {
    const course = courses.find(c => c.id === courseId);
    setSelectedCourse(course || null);
    setSelectedBranch(null);
    setSelectedVariantId(null);
    setFeeDetails(null);
    form.setFieldsValue({ branch_id: undefined, course_variant_id: undefined });
  };

  const onBranchChange = (branchId) => {
    const branch = selectedCourse?.branches?.find(b => b.id === branchId);
    setSelectedBranch(branch || null);
    setSelectedVariantId(null);
    setFeeDetails(null);
    form.setFieldsValue({ course_variant_id: undefined });
  };

  const onVariantChange = async (variantId) => {
    setSelectedVariantId(variantId);
    setFeeDetails(null);
    if (!variantId) return;
    setLoadingFee(true);
    try {
      const response = isAdmin
        ? await adminAPI.getFeeByVariant(variantId)
        : await franchiseAPI.getFeeByVariant(variantId);
      const fees = response.data;
      const fee = Array.isArray(fees) ? fees[0] : fees;
      setFeeDetails(fee || null);
    } catch {
      setFeeDetails(null);
    } finally {
      setLoadingFee(false);
    }
  };

  // Determine which education sections to show based on course's eligible_education (comma-separated)
  const eligibleEducationList = selectedCourse?.eligible_education
    ? selectedCourse.eligible_education.split(',').map(e => e.trim())
    : [];
  const showEighth     = eligibleEducationList.some(e => ['Class 8'].includes(e));
  const showTenth      = eligibleEducationList.some(e => ['Class 10', 'Class 12', 'UG', 'PG'].includes(e));
  const showTwelfth    = eligibleEducationList.some(e => ['Class 12', 'UG', 'PG'].includes(e));
  const showGraduation = eligibleEducationList.some(e => ['UG', 'PG'].includes(e));

  // Course has branches defined?
  const courseBranches = selectedCourse?.branches?.filter(b => b.is_active !== false) || [];
  const hasBranches = courseBranches.length > 0;

  // If a branch is selected, use that branch's variants; otherwise use course-level variants
  const courseVariants = selectedBranch
    ? selectedBranch.variants?.filter(v => v.is_active !== false) || []
    : selectedCourse?.variants?.filter(v => v.is_active !== false && !v.branch_id) || [];

  const uploadDocuments = async (studentId) => {
    const hasFiles = passportPhotoFile || aadharCardFile || docEighthFile || docTenthFile || docTwelfthFile || docGraduationFile;
    if (!hasFiles) return;
    const formData = new FormData();
    if (passportPhotoFile) formData.append('passport_photo', passportPhotoFile);
    if (aadharCardFile) formData.append('aadhar_card', aadharCardFile);
    if (docEighthFile) formData.append('doc_eighth', docEighthFile);
    if (docTenthFile) formData.append('doc_tenth', docTenthFile);
    if (docTwelfthFile) formData.append('doc_twelfth', docTwelfthFile);
    if (docGraduationFile) formData.append('doc_graduation', docGraduationFile);
    try {
      if (isAdmin) {
        await adminAPI.uploadStudentDocuments(studentId, formData);
      } else {
        await franchiseAPI.uploadStudentDocuments(studentId, formData);
      }
    } catch (err) {
      message.warning('Student created but document upload failed. Please re-upload documents from edit.');
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      let skillsList = (values.skills || []).filter(s => s !== 'Others');
      if (values.skills_other) {
        skillsList.push(values.skills_other);
      }
      const { skills_other, branch_specialization_other, ...rest } = values;
      // If specialization is "Others", use the custom typed value
      if (rest.branch_specialization === 'Others' && branch_specialization_other) {
        rest.branch_specialization = branch_specialization_other;
      }
      const payload = {
        ...rest,
        skills: skillsList.length > 0 ? skillsList.join(', ') : null,
        dob: values.dob ? values.dob.format('YYYY-MM-DD') : undefined,
      };
      if (editData) {
        if (isAdmin) {
          await adminAPI.updateStudent(studentId, payload);
        } else {
          await franchiseAPI.updateStudent(studentId, payload);
        }
        await uploadDocuments(studentId);
        message.success('Student record updated successfully!');
        // Small delay so the toast is visible before the modal closes
        setTimeout(() => { if (onSuccess) onSuccess(); }, 800);
      } else {
        let createdStudent;
        if (isAdmin) {
          createdStudent = await adminAPI.createStudent(payload);
        } else {
          createdStudent = await franchiseAPI.createStudent(payload);
        }
        await uploadDocuments(createdStudent.data.id);
        message.success('Student admission form submitted successfully!');
        setPrintData({ student: createdStudent.data, fee: feeDetails });
        setSubmitAlert({ type: 'success', message: 'Admission form submitted successfully! The student record has been created.' });
        form.resetFields();
        setPassportPhotoFile(null);
        setAadharCardFile(null);
        setDocEighthFile(null);
        setDocTenthFile(null);
        setDocTwelfthFile(null);
        setDocGraduationFile(null);
        setCourses([]);
        setDegreeType(null);
        setSelectedCourse(null);
        setSelectedBranch(null);
        setSelectedVariantId(null);
        setFeeDetails(null);
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      console.error('Form submit error:', error);
      const errMsg = error.response?.data?.detail
        || (typeof error.response?.data === 'string' ? error.response.data : null)
        || error.message
        || 'Failed to submit form. Please try again.';
      message.error(errMsg);
      setSubmitAlert({ type: 'error', message: errMsg });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = (overrideStudent = null, overrideFee = null) => {
    const s = overrideStudent || (printData && printData.student);
    const fee = overrideFee || (printData && printData.fee);
    if (!s) return;
    const studentName = [s.first_name, s.middle_name, s.last_name].filter(Boolean).join(' ');
    const submittedDate = new Date(s.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Admission Form - ${studentName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 13px; color: #222; padding: 24px; }
    .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 14px; }
    .header h1 { font-size: 22px; color: #333; letter-spacing: 1px; }
    .header h2 { font-size: 15px; color: #555; margin-top: 4px; }
    .form-id { font-size: 12px; color: #777; margin-top: 6px; }
    .section { margin-bottom: 16px; page-break-inside: avoid; }
    .section-title { background: #f0f0f0; padding: 6px 10px; font-weight: bold; font-size: 13px; border-left: 4px solid #ff0080; margin-bottom: 8px; }
    .row { display: flex; flex-wrap: wrap; margin-bottom: 4px; }
    .field { flex: 1 1 200px; padding: 4px 8px; min-width: 160px; }
    .field-label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 1px; }
    .field-value { font-size: 13px; font-weight: 500; border-bottom: 1px solid #ddd; padding-bottom: 3px; min-height: 20px; }
    .field-full { flex: 0 0 100%; }
    .edu-row { margin-bottom: 6px; padding: 6px 8px; background: #fafafa; border-left: 3px solid #ddd; font-size: 12px; }
    .footer { margin-top: 32px; display: flex; justify-content: space-between; align-items: flex-end; padding-top: 16px; border-top: 1px solid #ddd; }
    .signature-box { text-align: center; width: 180px; }
    .signature-line { border-bottom: 1px solid #333; margin-bottom: 6px; height: 50px; }
    .signature-label { font-size: 11px; color: #555; }
    .total-fee { font-size: 16px; font-weight: bold; color: #2a7d0a; }
    @media print { body { padding: 12px; } button { display: none; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>SkillEdge Learning</h1>
    <h2>Student Admission Form</h2>
    <div class="form-id">Form No: ${s.id} &nbsp;|&nbsp; Submitted: ${submittedDate} &nbsp;|&nbsp; Status: ${s.status}</div>
  </div>

  <div class="section">
    <div class="section-title">Personal Details</div>
    <div class="row">
      <div class="field field-full"><div class="field-label">Student Full Name</div><div class="field-value">${studentName}</div></div>
    </div>
    <div class="row">
      <div class="field"><div class="field-label">Date of Birth</div><div class="field-value">${s.dob || '-'}</div></div>
      <div class="field"><div class="field-label">Contact Number</div><div class="field-value">${s.contact_number || '-'}</div></div>
      <div class="field"><div class="field-label">Email</div><div class="field-value">${s.email || '-'}</div></div>
    </div>
    <div class="row">
      <div class="field"><div class="field-label">Father's Name</div><div class="field-value">${s.father_name || '-'}</div></div>
      <div class="field"><div class="field-label">Mother's Name</div><div class="field-value">${s.mother_name || '-'}</div></div>
      <div class="field"><div class="field-label">Aadhar Number</div><div class="field-value">${s.aadhar_number || '-'}</div></div>
    </div>
    <div class="row">
      <div class="field"><div class="field-label">APAAR ID</div><div class="field-value">${s.apaar_id || '-'}</div></div>
      <div class="field"><div class="field-label">Session</div><div class="field-value">${s.session || '-'}</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Academic Details</div>
    <div class="row">
      <div class="field"><div class="field-label">Degree Type</div><div class="field-value">${s.degree_type || '-'}</div></div>
      <div class="field"><div class="field-label">University</div><div class="field-value">${s.university_name || '-'}</div></div>
      <div class="field"><div class="field-label">Course</div><div class="field-value">${s.course_name || '-'}</div></div>
    </div>
    <div class="row">
      ${s.branch_name ? `<div class="field"><div class="field-label">Branch</div><div class="field-value">${s.branch_name}</div></div>` : ''}
      <div class="field"><div class="field-label">Course Type</div><div class="field-value">${s.course_type || '-'}</div></div>
      <div class="field"><div class="field-label">Specialization</div><div class="field-value">${s.branch_specialization || '-'}</div></div>
    </div>
    ${s.skills ? `<div class="row"><div class="field field-full"><div class="field-label">Skills</div><div class="field-value">${s.skills}</div></div></div>` : ''}
  </div>

  <div class="section">
    <div class="section-title">Fee Details</div>
    ${fee ? `
    <div class="row">
      <div class="field"><div class="field-label">Tuition Fee</div><div class="field-value">&#8377;${fee.tuition_fee}</div></div>
      <div class="field"><div class="field-label">Registration Fee</div><div class="field-value">&#8377;${fee.registration_fee}</div></div>
      <div class="field"><div class="field-label">Exam Fee (Yearly)</div><div class="field-value">&#8377;${fee.exam_fee_yearly}</div></div>
      ${parseFloat(fee.other_fees) > 0 ? `<div class="field"><div class="field-label">Other Fees</div><div class="field-value">&#8377;${fee.other_fees}</div></div>` : ''}
    </div>
    <div class="row">
      <div class="field"><div class="field-label">Total Fee (First Year)</div><div class="field-value total-fee">&#8377;${fee.total_fee}${fee.academic_year ? ' (' + fee.academic_year + ')' : ''}</div></div>
    </div>` : `<div class="row"><div class="field"><div class="field-label">Total Fee</div><div class="field-value total-fee">${s.total_fee ? '&#8377;' + s.total_fee : '-'}</div></div></div>`}
  </div>

  ${(s.eighth_board || s.tenth_board || s.twelfth_board || s.grad_university) ? `<div class="section">
    <div class="section-title">Education History</div>
    ${s.eighth_board ? `<div class="edu-row"><strong>8th Class</strong> &mdash; Board: ${s.eighth_board === 'Others' ? (s.eighth_board_other || '-') : s.eighth_board} | School: ${s.eighth_school || '-'} | Year: ${s.eighth_passing_year || '-'} | %: ${s.eighth_percentage || '-'}</div>` : ''}
    ${s.tenth_board ? `<div class="edu-row"><strong>10th Class</strong> &mdash; Board: ${s.tenth_board === 'Others' ? (s.tenth_board_other || '-') : s.tenth_board} | School: ${s.tenth_school || '-'} | Year: ${s.tenth_passing_year || '-'} | %: ${s.tenth_percentage || '-'}</div>` : ''}
    ${s.twelfth_board ? `<div class="edu-row"><strong>12th Class</strong> &mdash; Board: ${s.twelfth_board === 'Others' ? (s.twelfth_board_other || '-') : s.twelfth_board} | School: ${s.twelfth_school || '-'} | Year: ${s.twelfth_passing_year || '-'} | %: ${s.twelfth_percentage || '-'}</div>` : ''}
    ${s.grad_university ? `<div class="edu-row"><strong>Graduation</strong> &mdash; University: ${s.grad_university} | Degree: ${s.grad_degree || '-'} | Subject: ${s.grad_subject || '-'} | Year: ${s.grad_passing_year || '-'} | %: ${s.grad_percentage || '-'}</div>` : ''}
  </div>` : ''}

  <div class="section">
    <div class="section-title">Contact &amp; Address</div>
    <div class="row">
      <div class="field field-full"><div class="field-label">Address</div><div class="field-value">${[s.street_locality, s.city, s.district, s.state].filter(Boolean).join(', ')} &mdash; ${s.pincode || ''}</div></div>
    </div>
  </div>

  <div class="footer">
    <div class="signature-box">
      <div class="signature-line"></div>
      <div class="signature-label">Student's Signature</div>
    </div>
    <div style="text-align:center;font-size:11px;color:#777;line-height:1.8;">
      <div>Form ID: <strong>${s.id}</strong></div>
      <div>Franchise: ${s.franchise_name || '-'}</div>
      <div>Date: ${submittedDate}</div>
    </div>
    <div class="signature-box">
      <div class="signature-line"></div>
      <div class="signature-label">Authorized Signature &amp; Seal</div>
    </div>
  </div>
</body>
</html>`;

    const w = window.open('', '_blank', 'width=900,height=750');
    if (w) {
      w.document.write(html);
      w.document.close();
      w.focus();
      setTimeout(() => { w.print(); }, 400);
    }
  };

  const eighthBoardValue = Form.useWatch('eighth_board', form);
  const tenthBoardValue = Form.useWatch('tenth_board', form);
  const twelfthBoardValue = Form.useWatch('twelfth_board', form);
  const skillsValue = Form.useWatch('skills', form) || [];
  const specializationValue = Form.useWatch('branch_specialization', form);

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
        {/* Franchise Selector — admin only */}
        {isAdmin && (
          <div className="form-section">
            <h3>
              <User size={20} style={{ marginRight: '8px' }} />
              Assign to Franchise
            </h3>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="franchise_id"
                  label="Franchise"
                  rules={[{ required: true, message: 'Please select a franchise' }]}
                >
                  <Select placeholder="Select franchise" size="large" showSearch optionFilterProp="children">
                    {franchises.map(f => (
                      <Option key={f.id} value={f.id}>{f.full_name} ({f.username})</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </div>
        )}

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
            <Col xs={24} sm={8}>
              <Form.Item
                name="apaar_id"
                label="APAAR ID"
              >
                <Input prefix={<Hash size={16} />} placeholder="Enter APAAR ID" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="session"
                label="Session"
                rules={[{ required: true, message: 'Please enter session' }]}
              >
                <Input placeholder="e.g., 2025-2026" size="large" />
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
                  {[
                    { value: 'UG', label: 'UG (Undergraduate)' },
                    { value: 'PG', label: 'PG (Postgraduate)' },
                    { value: 'Diploma/Certificate', label: 'Diploma/Certificate' },
                    { value: 'Class', label: 'Class' },
                  ]
                    .filter(opt => isAdmin || !allowedDegreeTypes || allowedDegreeTypes.includes(opt.value))
                    .map(opt => <Option key={opt.value} value={opt.value}>{opt.label}</Option>)}
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
                  onChange={onCourseChange}
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
          {hasBranches && (
            <Row gutter={16}>
              <Col xs={24} sm={8}>
                <Form.Item
                  name="branch_id"
                  label="Branch"
                  rules={[{ required: true, message: 'Please select branch' }]}
                >
                  <Select
                    placeholder="Select branch"
                    size="large"
                    disabled={!selectedCourse}
                    onChange={onBranchChange}
                    showSearch
                    optionFilterProp="children"
                  >
                    {courseBranches.map(b => (
                      <Option key={b.id} value={b.id}>{b.name}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          )}
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item
                name="course_variant_id"
                label="Course Type"
                rules={[{ required: true, message: 'Please select course type' }]}
              >
                <Select
                  placeholder={!selectedCourse ? "Select course first" : "Select course type"}
                  size="large"
                  disabled={courseVariants.length === 0}
                  onChange={onVariantChange}
                >
                  {courseVariants.map(v => (
                    <Option key={v.id} value={v.id}>
                      {v.course_type}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="branch_specialization" label="Specialization (Optional)">
                <Select placeholder="Select specialization" size="large" allowClear>
                  <Option value="NA">NA</Option>
                  <Option value="Others">Others</Option>
                </Select>
              </Form.Item>
            </Col>
            {specializationValue === 'Others' && (
              <Col xs={24} sm={8}>
                <Form.Item
                  name="branch_specialization_other"
                  label="Specify Specialization"
                  rules={[{ required: true, message: 'Please specify specialization' }]}
                >
                  <Input prefix={<BookOpen size={16} />} placeholder="Enter specialization" size="large" />
                </Form.Item>
              </Col>
            )}
            <Col xs={24} sm={8}>
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
                  <Option value="Economics">Economics</Option>
                  <Option value="English Literature">English Literature</Option>
                  <Option value="Hindi Literature">Hindi Literature</Option>
                  <Option value="Political Science">Political Science</Option>
                  <Option value="Sociology">Sociology</Option>
                  <Option value="Others">Others</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          {skillsValue.includes('Others') && (
            <Row gutter={16}>
              <Col xs={24} sm={12}>
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
          {/* Fee Details Card */}
          {loadingFee && (
            <div style={{ marginTop: '16px', padding: '16px', background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '8px' }}>
              <div style={{ color: '#888' }}>Loading fee details...</div>
            </div>
          )}
          {!loadingFee && feeDetails && (
            <div style={{ marginTop: '16px', padding: '16px', background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '8px' }}>
              <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '12px', color: '#389e0d' }}>
                Fee Details
              </div>
              <Row gutter={[16, 8]}>
                <Col xs={12} sm={6}>
                  <div style={{ fontSize: '12px', color: '#888' }}>Tuition Fee</div>
                  <div style={{ fontWeight: 600, fontSize: '15px' }}>₹{feeDetails.tuition_fee ?? '-'}</div>
                </Col>
                <Col xs={12} sm={6}>
                  <div style={{ fontSize: '12px', color: '#888' }}>Registration Fee</div>
                  <div style={{ fontWeight: 600, fontSize: '15px' }}>₹{feeDetails.registration_fee ?? '-'}</div>
                </Col>
                <Col xs={12} sm={6}>
                  <div style={{ fontSize: '12px', color: '#888' }}>Exam Fee (Yearly)</div>
                  <div style={{ fontWeight: 600, fontSize: '15px' }}>₹{feeDetails.exam_fee_yearly ?? '-'}</div>
                </Col>
                {feeDetails.other_fees > 0 && (
                  <Col xs={12} sm={6}>
                    <div style={{ fontSize: '12px', color: '#888' }}>Other Fees</div>
                    <div style={{ fontWeight: 600, fontSize: '15px' }}>₹{feeDetails.other_fees}</div>
                  </Col>
                )}
                <Col xs={24}>
                  <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #b7eb8f', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', color: '#555' }}>
                      Total Fee {feeDetails.academic_year ? `(${feeDetails.academic_year})` : ''}
                    </span>
                    <span style={{ fontWeight: 700, fontSize: '18px', color: '#389e0d' }}>
                      ₹{feeDetails.total_fee ?? '-'}
                    </span>
                  </div>
                </Col>
              </Row>
            </div>
          )}
          {!loadingFee && !feeDetails && selectedVariantId && (
            <div style={{ marginTop: '16px', padding: '12px 16px', background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: '8px', color: '#ad6800' }}>
              No fee structure set for this combination. Please contact the admin to configure fees before submitting.
            </div>
          )}

          {selectedCourse && eligibleEducationList.length > 0 && (
            <div style={{ padding: '8px 12px', background: '#f0f5ff', borderRadius: '6px', marginTop: '8px' }}>
              <strong>Eligible Education:</strong> {eligibleEducationList.join(', ')} — Please fill the required education details below.
            </div>
          )}
        </div>

        {/* 8th Details — shown when eligible_education requires Class 8 */}
        {showEighth && (
          <div className="form-section">
            <h3>
              <BookOpen size={20} style={{ marginRight: '8px' }} />
              8th Class Details
            </h3>
            <Row gutter={16}>
              <Col xs={24} sm={8}>
                <Form.Item
                  name="eighth_board"
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
              {eighthBoardValue === 'Others' && (
                <Col xs={24} sm={8}>
                  <Form.Item
                    name="eighth_board_other"
                    label="Board Name"
                    rules={[{ required: true, message: 'Please enter board name' }]}
                  >
                    <Input placeholder="Enter board name" size="large" />
                  </Form.Item>
                </Col>
              )}
              <Col xs={24} sm={8}>
                <Form.Item
                  name="eighth_school"
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
                  name="eighth_passing_year"
                  label="Passing Year"
                  rules={[{ required: true, message: 'Please enter passing year' }]}
                >
                  <Input placeholder="e.g., 2018" size="large" maxLength={4} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item
                  name="eighth_percentage"
                  label="Percentage / CGPA"
                  rules={[{ required: true, message: 'Please enter percentage' }]}
                >
                  <Input placeholder="e.g., 78.5%" size="large" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item label="8th Marksheet" extra="JPG, PNG or PDF, max 5 MB">
                  <Upload
                    beforeUpload={(file) => { setDocEighthFile(file); return false; }}
                    onRemove={() => setDocEighthFile(null)}
                    fileList={docEighthFile ? [{ uid: '-8', name: docEighthFile.name, status: 'done' }] : []}
                    accept=".jpg,.jpeg,.png,.pdf"
                    maxCount={1}
                  >
                    <Button icon={<UploadOutlined />} size="large" style={{ width: '100%' }}>
                      {docEighthFile ? 'Change File' : 'Upload 8th Marksheet'}
                    </Button>
                  </Upload>
                </Form.Item>
              </Col>
            </Row>
          </div>
        )}

        {/* 10th Details — shown when eligible_education requires Class 10 or above */}
        {showTenth && (
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
              <Col xs={24} sm={8}>
                <Form.Item label="10th Marksheet" extra="JPG, PNG or PDF, max 5 MB">
                  <Upload
                    beforeUpload={(file) => { setDocTenthFile(file); return false; }}
                    onRemove={() => setDocTenthFile(null)}
                    fileList={docTenthFile ? [{ uid: '-10', name: docTenthFile.name, status: 'done' }] : []}
                    accept=".jpg,.jpeg,.png,.pdf"
                    maxCount={1}
                  >
                    <Button icon={<UploadOutlined />} size="large" style={{ width: '100%' }}>
                      {docTenthFile ? 'Change File' : 'Upload 10th Marksheet'}
                    </Button>
                  </Upload>
                </Form.Item>
              </Col>
            </Row>
          </div>
        )}

        {/* 12th Details — shown when eligible_education requires Class 12 or above */}
        {showTwelfth && (
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
              <Col xs={24} sm={8}>
                <Form.Item label="12th Marksheet" extra="JPG, PNG or PDF, max 5 MB">
                  <Upload
                    beforeUpload={(file) => { setDocTwelfthFile(file); return false; }}
                    onRemove={() => setDocTwelfthFile(null)}
                    fileList={docTwelfthFile ? [{ uid: '-12', name: docTwelfthFile.name, status: 'done' }] : []}
                    accept=".jpg,.jpeg,.png,.pdf"
                    maxCount={1}
                  >
                    <Button icon={<UploadOutlined />} size="large" style={{ width: '100%' }}>
                      {docTwelfthFile ? 'Change File' : 'Upload 12th Marksheet'}
                    </Button>
                  </Upload>
                </Form.Item>
              </Col>
            </Row>
          </div>
        )}

        {/* Graduation Details — shown when eligible_education requires UG or PG */}
        {showGraduation && (
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
              <Col xs={24} sm={8}>
                <Form.Item label="Graduation Certificate" extra="JPG, PNG or PDF, max 5 MB">
                  <Upload
                    beforeUpload={(file) => { setDocGraduationFile(file); return false; }}
                    onRemove={() => setDocGraduationFile(null)}
                    fileList={docGraduationFile ? [{ uid: '-g', name: docGraduationFile.name, status: 'done' }] : []}
                    accept=".jpg,.jpeg,.png,.pdf"
                    maxCount={1}
                  >
                    <Button icon={<UploadOutlined />} size="large" style={{ width: '100%' }}>
                      {docGraduationFile ? 'Change File' : 'Upload Graduation Certificate'}
                    </Button>
                  </Upload>
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
            <Col xs={24} sm={6}>
              <Form.Item
                name="city"
                label="City"
                rules={[{ required: true, message: 'Please enter city' }]}
              >
                <Input prefix={<MapPin size={16} />} placeholder="Enter city" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={6}>
              <Form.Item
                name="district"
                label="District"
              >
                <Input prefix={<MapPin size={16} />} placeholder="Enter district" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={6}>
              <Form.Item
                name="state"
                label="State"
                rules={[{ required: true, message: 'Please enter state' }]}
              >
                <Input prefix={<MapPin size={16} />} placeholder="Enter state" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={6}>
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

        {/* Document Upload Section */}
        <div className="form-section">
          <h3>
            <FileText size={20} style={{ marginRight: '8px' }} />
            Document Uploads
          </h3>
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item label="Passport Photo" extra="JPG or PNG, max 5 MB">
                <Upload
                  beforeUpload={(file) => { setPassportPhotoFile(file); return false; }}
                  onRemove={() => setPassportPhotoFile(null)}
                  fileList={passportPhotoFile ? [{ uid: '-1', name: passportPhotoFile.name, status: 'done' }] : []}
                  accept=".jpg,.jpeg,.png"
                  maxCount={1}
                >
                  <Button icon={<UploadOutlined />} size="large" style={{ width: '100%' }}>
                    {passportPhotoFile ? 'Change Photo' : 'Upload Passport Photo'}
                  </Button>
                </Upload>
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item label="Aadhar Card" extra="JPG, PNG or PDF, max 5 MB">
                <Upload
                  beforeUpload={(file) => { setAadharCardFile(file); return false; }}
                  onRemove={() => setAadharCardFile(null)}
                  fileList={aadharCardFile ? [{ uid: '-2', name: aadharCardFile.name, status: 'done' }] : []}
                  accept=".jpg,.jpeg,.png,.pdf"
                  maxCount={1}
                >
                  <Button icon={<UploadOutlined />} size="large" style={{ width: '100%' }}>
                    {aadharCardFile ? 'Change File' : 'Upload Aadhar Card'}
                  </Button>
                </Upload>
              </Form.Item>
            </Col>
          </Row>
        </div>

        {submitAlert && (
          <Form.Item>
            <Alert
              type={submitAlert.type}
              message={submitAlert.type === 'success' ? 'Submission Successful' : 'Submission Failed'}
              description={submitAlert.message}
              showIcon
              closable
              onClose={() => { setSubmitAlert(null); setPrintData(null); }}
              style={{ marginBottom: 8 }}
            />
          </Form.Item>
        )}

        {(printData || editData) && (
          <Form.Item>
            <Button
              icon={<Printer size={16} />}
              onClick={() => handlePrint(editData || null, feeDetails)}
              size="large"
              style={{ background: '#389e0d', borderColor: '#389e0d', color: '#fff' }}
            >
              Print / Download PDF
            </Button>
          </Form.Item>
        )}

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} size="large" block className="submit-button">
            {editData ? 'Update Admission Form' : 'Submit Admission Form'}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default StudentForm;
