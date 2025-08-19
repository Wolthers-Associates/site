import { useState, useRef } from 'react';
import styles from '../styles/CsvUpload.module.css';

export default function CsvUpload({ onUploadSuccess }) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success', 'error', 'info'
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file) => {
    // Validate file type
    if (!file.name.endsWith('.csv')) {
      setMessage('Please select a CSV file');
      setMessageType('error');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setMessage('File size must be less than 10MB');
      setMessageType('error');
      return;
    }

    setUploading(true);
    setMessage('Uploading...');
    setMessageType('info');

    const formData = new FormData();
    formData.append('csvFile', file);

    try {
      const response = await fetch('/mails/api/upload-csv', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setMessage(result.message || 'File uploaded successfully!');
        setMessageType('success');
        
        // Clear file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        // Notify parent component
        if (onUploadSuccess) {
          onUploadSuccess(result);
        }

        // Auto-clear success message after 5 seconds
        setTimeout(() => {
          setMessage('');
          setMessageType('');
        }, 5000);
      } else {
        setMessage(result.error || 'Upload failed');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setMessage('Upload failed. Please try again.');
      setMessageType('error');
    } finally {
      setUploading(false);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={styles.uploadContainer}>
      <div
        className={`${styles.dropZone} ${dragActive ? styles.dragActive : ''} ${uploading ? styles.uploading : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileSelect}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className={styles.fileInput}
        />
        
        <div className={styles.uploadContent}>
          {uploading ? (
            <>
              <div className={styles.spinner}></div>
              <p>Uploading CSV...</p>
            </>
          ) : (
            <>
              <div className={styles.uploadIcon}>📁</div>
              <p className={styles.uploadText}>
                Drag & drop your CSV file here, or <span className={styles.clickText}>click to browse</span>
              </p>
              <p className={styles.uploadSubtext}>
                Supports CSV files up to 10MB with email data
              </p>
              <div className={styles.expectedFormat}>
                <strong>Expected columns:</strong> sender_address, origin_timestamp_utc, message_subject, total_bytes, recipient_status
              </div>
            </>
          )}
        </div>
      </div>

      {message && (
        <div className={`${styles.message} ${styles[messageType]}`}>
          {messageType === 'success' && '✅ '}
          {messageType === 'error' && '❌ '}
          {messageType === 'info' && 'ℹ️ '}
          {message}
        </div>
      )}
    </div>
  );
}