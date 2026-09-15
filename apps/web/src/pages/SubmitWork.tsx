import React, { useState, useEffect } from 'react';
import { submissionsApi, departmentsApi, usersApi } from '../services/api';
import { DepartmentDto, UserDto, DocumentType } from '@fulafia/shared';
import { Upload, FileText, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useUI } from '../components/UIProvider';

interface SubmitWorkProps {
  currentUser: UserDto;
  onSuccess: (workId: string) => void;
}

export const SubmitWork: React.FC<SubmitWorkProps> = ({ currentUser, onSuccess }) => {
  const { toast } = useUI();
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [supervisors, setSupervisors] = useState<UserDto[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [keywords, setKeywords] = useState('');
  const [documentType, setDocumentType] = useState<DocumentType>(DocumentType.THESIS);
  const [year, setYear] = useState(new Date().getFullYear());
  const [degreeProgramme, setDegreeProgramme] = useState('M.Sc. Computer Science');
  const [departmentId, setDepartmentId] = useState(currentUser.departmentId || '');
  const [supervisorId, setSupervisorId] = useState('');
  const [embargoReleaseDate, setEmbargoReleaseDate] = useState('');
  const [file, setFile] = useState<File | null>(null);

  // Turnitin Scope settings per submission
  const [compareStudentPapers, setCompareStudentPapers] = useState(true);
  const [compareInstitutional, setCompareInstitutional] = useState(true);
  const [compareInternet, setCompareInternet] = useState(true);
  const [submitToRepo, setSubmitToRepo] = useState(true);

  useEffect(() => {
    departmentsApi.getAll().then((depts) => {
      setDepartments(depts);
      if (!departmentId && depts.length > 0) setDepartmentId(depts[0].id);
    });
  }, []);

  useEffect(() => {
    if (departmentId) {
      usersApi.getSupervisors(departmentId).then(setSupervisors).catch(console.error);
    }
  }, [departmentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !abstract || !departmentId) {
      toast('warning', 'Required Fields Missing', 'Please fill out title, abstract, and department before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('abstract', abstract);
      const kwArray = keywords.split(',').map((k) => k.trim()).filter(Boolean);
      formData.append('keywords', JSON.stringify(kwArray));
      formData.append('documentType', documentType);
      formData.append('year', String(year));
      formData.append('degreeProgramme', degreeProgramme);
      formData.append('departmentId', departmentId);
      if (supervisorId) formData.append('supervisorId', supervisorId);
      if (embargoReleaseDate) formData.append('embargoReleaseDate', embargoReleaseDate);

      // Add Turnitin scope toggles JSON
      const scopes = {
        compareStudentPapers,
        compareInstitutional,
        compareInternet,
        submitToRepo,
      };
      formData.append('scopes', JSON.stringify(scopes));

      if (file) {
        formData.append('file', file);
      }

      const result = await submissionsApi.createSubmission(formData);
      toast('success', 'Submission Received', 'Your work has been submitted successfully and is pending review.');
      onSuccess(result.id);
    } catch (err: any) {
      toast('error', 'Submission Failed', err.response?.data?.message || 'An error occurred during submission.');
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-shark)' }}>
          Submit Work to Institutional Repository
        </h1>
        <p style={{ color: 'var(--color-gray-600)', fontSize: '0.9375rem' }}>
          Enter work metadata, select your academic supervisor, configure plagiarism scopes, and attach your document.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card">
        <h2 className="card-title">1. Work Metadata</h2>

        <div className="form-group">
          <label className="form-label">Title of Work *</label>
          <input
            type="text"
            required
            placeholder="e.g. Distributed Consensus Algorithms for Institutional Data Repositories"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Abstract *</label>
          <textarea
            required
            rows={5}
            placeholder="Provide a comprehensive academic summary of the research..."
            value={abstract}
            onChange={(e) => setAbstract(e.target.value)}
            className="form-textarea"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Document Type *</label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value as any)}
              className="form-select"
            >
              <option value="THESIS">Thesis</option>
              <option value="DISSERTATION">Dissertation</option>
              <option value="JOURNAL_ARTICLE">Journal Article</option>
              <option value="CONFERENCE_PAPER">Conference Paper</option>
              <option value="TECHNICAL_REPORT">Technical Report</option>
              <option value="DATASET">Dataset</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Publication / Award Year *</label>
            <input
              type="number"
              required
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="form-input"
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Department *</label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="form-select"
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Degree / Programme *</label>
            <input
              type="text"
              required
              placeholder="e.g. B.Sc. Computer Science, M.Sc. Biochemistry, Ph.D."
              value={degreeProgramme}
              onChange={(e) => setDegreeProgramme(e.target.value)}
              className="form-input"
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Academic Supervisor</label>
            <select
              value={supervisorId}
              onChange={(e) => setSupervisorId(e.target.value)}
              className="form-select"
            >
              <option value="">Select Supervisor (Optional)</option>
              {supervisors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.firstName} {s.lastName} ({s.email})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Keywords (Comma Separated)</label>
            <input
              type="text"
              placeholder="Distributed Systems, Consensus, FULafia"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              className="form-input"
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Academic Embargo Release Date (Optional)</label>
          <input
            type="date"
            value={embargoReleaseDate}
            onChange={(e) => setEmbargoReleaseDate(e.target.value)}
            className="form-input"
          />
          <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', marginTop: '0.25rem' }}>
            If set, full-text download is restricted until this date. Public metadata remains discoverable.
          </div>
        </div>

        {/* Turnitin Per-Submission Scope Settings */}
        <div style={{ backgroundColor: 'var(--color-gray-50)', border: '1px solid var(--color-gray-200)', borderRadius: 'var(--border-radius-md)', padding: '1rem', margin: '1.5rem 0' }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-shark)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldAlert size={16} color="var(--color-luxor-gold)" /> Turnitin Plagiarism Scope Configuration
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-gray-600)', marginBottom: '0.75rem' }}>
            Configure comparison scopes for Layer 1 external plagiarism verification.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.8125rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={compareStudentPapers} onChange={(e) => setCompareStudentPapers(e.target.checked)} />
              Compare against Student Paper Corpus
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={compareInstitutional} onChange={(e) => setCompareInstitutional(e.target.checked)} />
              Compare against Institutional Corpus
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={compareInternet} onChange={(e) => setCompareInternet(e.target.checked)} />
              Compare against Internet Archives
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={submitToRepo} onChange={(e) => setSubmitToRepo(e.target.checked)} />
              Submit to Turnitin Repository (Opt-in)
            </label>
          </div>
        </div>

        {/* Document Upload */}
        <h2 className="card-title" style={{ marginTop: '1.5rem' }}>2. Document File Upload</h2>
        <div className="form-group">
          <label className="form-label">Document File (PDF / DOCX)</label>
          <input
            type="file"
            accept=".pdf,.docx"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="form-input"
          />
          <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', marginTop: '0.25rem' }}>
            Magic bytes and SHA-256 integrity checksum will be verified automatically upon upload.
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button type="submit" disabled={submitting} className="btn btn-primary btn-lg">
            <Upload size={18} /> {submitting ? 'Submitting Work...' : 'Submit Work for Review'}
          </button>
        </div>
      </form>
    </div>
  );
};
