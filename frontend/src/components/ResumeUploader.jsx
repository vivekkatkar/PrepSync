import React, { useState } from 'react';
import axios from 'axios';
import { Upload, Trash2, CheckCircle, FileText } from 'lucide-react';
import { API, getAuthHeaders } from '../utils/api';

export default function ResumeUploader({ resumeUrl, onResumeChange }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = React.useRef();

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError('');
    setUploading(true);

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const res = await axios.post(`${API}/user/resume`, formData, getAuthHeaders());
      onResumeChange(res.data.resumeUrl);
    } catch (err) {
      console.error(err);
      setError('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    setError('');
    setUploading(true);
    try {
      await axios.delete(`${API}/user/resume`, getAuthHeaders());
      onResumeChange(null);
    } catch (err) {
      console.error(err);
      setError('Delete failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="h-full">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-white">Resume</h3>
      </div>

      {resumeUrl ? (
        <div className="space-y-4">
          <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-green-400 font-medium">Resume Uploaded</span>
            </div>
            <a
              href={resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300 underline transition-colors"
            >
              View Your Resume
            </a>
          </div>

          <button
            onClick={handleDelete}
            disabled={uploading}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-600/30 hover:text-red-300 rounded-lg transition-all disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>{uploading ? 'Deleting...' : 'Delete Resume'}</span>
          </button>

          {error && (
            <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-purple-500/50 transition-colors">
            <Upload className="w-12 h-12 text-purple-400 mx-auto mb-3" />
            <p className="text-purple-200 mb-4">Upload your resume to get started</p>

            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              ref={fileRef}
              className="hidden"
            />

            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading...' : 'Choose File'}
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
