'use client';
import { useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { 
  FileText, 
  ExternalLink, 
  Upload, 
  Download,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  FileCode
} from 'lucide-react';
import { showSuccess, showError, showConfirm } from '@/app/lib/swal';

// Map file types to Google Drive MIME types
const GOOGLE_MIME_TYPES = {
  // Documents
  'docx': { mime: 'application/vnd.google-apps.document', exportMime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', icon: FileText, color: 'blue' },
  'doc': { mime: 'application/vnd.google-apps.document', exportMime: 'application/msword', icon: FileText, color: 'blue' },
  'txt': { mime: 'application/vnd.google-apps.document', exportMime: 'text/plain', icon: FileCode, color: 'gray' },
  'rtf': { mime: 'application/vnd.google-apps.document', exportMime: 'application/rtf', icon: FileText, color: 'blue' },
  
  // Spreadsheets
  'xlsx': { mime: 'application/vnd.google-apps.spreadsheet', exportMime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', icon: FileSpreadsheet, color: 'green' },
  'xls': { mime: 'application/vnd.google-apps.spreadsheet', exportMime: 'application/vnd.ms-excel', icon: FileSpreadsheet, color: 'green' },
  'csv': { mime: 'application/vnd.google-apps.spreadsheet', exportMime: 'text/csv', icon: FileSpreadsheet, color: 'green' },
  
  // Presentations
  'pptx': { mime: 'application/vnd.google-apps.presentation', exportMime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', icon: FileText, color: 'orange' },
  'ppt': { mime: 'application/vnd.google-apps.presentation', exportMime: 'application/vnd.ms-powerpoint', icon: FileText, color: 'orange' },
};

export default function GoogleEditorIntegration({ document, onSave, onClose }) {
  const [accessToken, setAccessToken] = useState(null);
  const [googleFileId, setGoogleFileId] = useState(null);
  const [googleFileUrl, setGoogleFileUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle, uploading, uploaded, saving
  
  const fileExtension = document.filename?.split('.').pop()?.toLowerCase();
  const googleConfig = GOOGLE_MIME_TYPES[fileExtension];
  const isSupported = !!googleConfig;

  // Check for existing token
  useEffect(() => {
    const token = localStorage.getItem('google_access_token');
    if (token) {
      setAccessToken(token);
    }
  }, []);

  // ✅ Google OAuth Login
  const login = useGoogleLogin({
    onSuccess: async (response) => {
      setAccessToken(response.access_token);
      localStorage.setItem('google_access_token', response.access_token);
      localStorage.setItem('google_token_expiry', Date.now() + (response.expires_in * 1000));
      await showSuccess('Connected', 'Successfully connected to Google Drive');
    },
    onError: (error) => {
      console.error('Login error:', error);
      showError('Login Failed', 'Failed to connect to Google Drive');
    },
    scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive',
  });

  // ✅ Upload file to Google Drive and convert
  const uploadToGoogleDrive = async () => {
    if (!accessToken) {
      login();
      return;
    }

    setLoading(true);
    setUploadStatus('uploading');
    
    try {
      // Step 1: Fetch the file from your server
      const fileResponse = await fetch(document.viewUrl, {
        credentials: 'include'
      });
      
      if (!fileResponse.ok) {
        throw new Error('Failed to fetch file from server');
      }
      
      const fileBlob = await fileResponse.blob();

      // Step 2: Upload to Google Drive with conversion
      const metadata = {
        name: document.title || document.filename,
        mimeType: googleConfig.mime, // Convert to Google format
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', fileBlob, document.filename);

      const uploadResponse = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: form,
        }
      );

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error?.message || 'Upload failed');
      }

      const uploadData = await uploadResponse.json();

      if (uploadData.id) {
        setGoogleFileId(uploadData.id);
        
        // Generate appropriate edit URL based on file type
        let editUrl;
        if (fileExtension === 'csv' || fileExtension === 'xlsx' || fileExtension === 'xls') {
          editUrl = `https://docs.google.com/spreadsheets/d/${uploadData.id}/edit`;
        } else if (fileExtension === 'pptx' || fileExtension === 'ppt') {
          editUrl = `https://docs.google.com/presentation/d/${uploadData.id}/edit`;
        } else {
          editUrl = `https://docs.google.com/document/d/${uploadData.id}/edit`;
        }
        
        setGoogleFileUrl(editUrl);
        setUploadStatus('uploaded');
        
        // Open in new tab
        window.open(editUrl, '_blank');
        
        await showSuccess(
          'Uploaded Successfully', 
          'File opened in Google. Edit and click "Save Changes Back" when done.'
        );
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('idle');
      await showError('Upload Failed', error.message || 'Failed to upload to Google Drive');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Download edited file from Google Drive
  const saveChangesBack = async () => {
    if (!googleFileId || !accessToken) return;

    const confirmed = await showConfirm(
      'Save Changes?',
      'This will download the edited file from Google Drive and update your document.',
      'Yes, Save',
      'Cancel'
    );

    if (!confirmed.isConfirmed) return;

    setLoading(true);
    setUploadStatus('saving');

    try {
      // Step 1: Export from Google Drive in original format
      const exportResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files/${googleFileId}/export?mimeType=${encodeURIComponent(googleConfig.exportMime)}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!exportResponse.ok) {
        throw new Error('Failed to export from Google Drive');
      }

      const blob = await exportResponse.blob();
      
      // Step 2: Upload back to your server (new version)
      const formData = new FormData();
      formData.append('file', blob, document.filename);

      const response = await fetch(`/api/documents/${document.id}/versions`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        await showSuccess('Saved Successfully', 'Your changes have been saved as a new version');
        
        // Cleanup Google Drive file (optional)
        await fetch(`https://www.googleapis.com/drive/v3/files/${googleFileId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        
        setGoogleFileId(null);
        setGoogleFileUrl(null);
        setUploadStatus('idle');
        
        if (onSave) onSave();
        if (onClose) onClose();
      } else {
        throw new Error(data.error || 'Failed to save changes');
      }
    } catch (error) {
      console.error('Save error:', error);
      await showError('Save Failed', error.message || 'Failed to save changes back');
    } finally {
      setLoading(false);
      setUploadStatus('uploaded');
    }
  };

  // ✅ Disconnect Google account
  const disconnect = () => {
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('google_token_expiry');
    setAccessToken(null);
    setGoogleFileId(null);
    setGoogleFileUrl(null);
  };

  if (!isSupported) {
    return (
      <div className="p-6 bg-yellow-50 rounded-lg border border-yellow-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-yellow-900 mb-1">
              Unsupported File Type
            </h3>
            <p className="text-sm text-yellow-800">
              Google Drive doesn't support editing <span className="font-mono">.{fileExtension}</span> files.
            </p>
            <p className="text-sm text-yellow-800 mt-2">
              Supported: DOCX, DOC, TXT, XLSX, XLS, CSV, PPTX, PPT
            </p>
          </div>
        </div>
      </div>
    );
  }

  const IconComponent = googleConfig.icon;

  return (
    <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className={`p-3 bg-${googleConfig.color}-50 rounded-lg`}>
          <IconComponent className={`w-8 h-8 text-${googleConfig.color}-600`} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-gray-900">{document.title}</h3>
          <p className="text-sm text-gray-600">Edit in Google Drive</p>
        </div>
        <img 
          src="https://www.google.com/images/branding/googleg/1x/googleg_standard_color_128dp.png" 
          alt="Google" 
          className="w-8 h-8"
        />
      </div>

      {/* Status Indicator */}
      {uploadStatus !== 'idle' && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2">
            {uploadStatus === 'uploading' && (
              <>
                <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                <span className="text-sm text-blue-800">Uploading to Google Drive...</span>
              </>
            )}
            {uploadStatus === 'uploaded' && (
              <>
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-800">File is open in Google Drive</span>
              </>
            )}
            {uploadStatus === 'saving' && (
              <>
                <RefreshCw className="w-4 h-4 text-purple-600 animate-spin" />
                <span className="text-sm text-purple-800">Saving changes back...</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        {!accessToken ? (
          // Not connected to Google
          <button
            onClick={() => login()}
            className="w-full px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-3 font-medium"
          >
            <img 
              src="https://www.google.com/images/branding/googleg/1x/googleg_standard_color_128dp.png" 
              alt="Google" 
              className="w-5 h-5"
            />
            Connect Google Account
          </button>
        ) : !googleFileId ? (
          // Connected but not uploaded
          <>
            <button
              onClick={uploadToGoogleDrive}
              disabled={loading}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Edit in Google Drive
                </>
              )}
            </button>

            <button
              onClick={disconnect}
              className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Disconnect Google Account
            </button>
          </>
        ) : (
          // File uploaded to Google Drive
          <>
            <a
              href={googleFileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-medium"
            >
              <ExternalLink className="w-5 h-5" />
              Open in Google Drive
            </a>

            <button
              onClick={saveChangesBack}
              disabled={loading}
              className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Save Changes Back
                </>
              )}
            </button>

            <button
              onClick={() => {
                setGoogleFileId(null);
                setGoogleFileUrl(null);
                setUploadStatus('idle');
              }}
              className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
          </>
        )}
      </div>

      {/* Info */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600">
          ℹ️ Your file will be converted to Google format for editing. When you save changes, it will be converted back to {fileExtension.toUpperCase()}.
        </p>
      </div>
    </div>
  );
}
