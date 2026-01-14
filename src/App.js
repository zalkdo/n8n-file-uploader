import React, { useState, useRef } from 'react';
import './App.css'; // 아래에서 작성할 CSS 파일

function App() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, uploading, success, error
  const [message, setMessage] = useState('');
  const fileInputRef = useRef(null);

  // n8n Webhook URL (사용자가 제공한 주소)
  const WEBHOOK_URL = 'http://192.168.6.188:5678/webhook-test/upload';

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    // 허용된 확장자 확인
    const allowedTypes = [
      'text/plain', 
      'application/pdf', 
      'text/csv', 
      'application/vnd.ms-excel' // 일부 CSV는 이 타입을 가질 수 있음
    ];
    
    // 확장자 이름으로도 이중 체크 (MIME 타입이 정확하지 않을 경우 대비)
    const fileName = selectedFile.name.toLowerCase();
    const isExtValid = fileName.endsWith('.txt') || fileName.endsWith('.pdf') || fileName.endsWith('.csv');

    if (allowedTypes.includes(selectedFile.type) || isExtValid) {
      setFile(selectedFile);
      setStatus('idle');
      setMessage('');
    } else {
      setStatus('error');
      setMessage('지원하지 않는 파일 형식입니다. (txt, pdf, csv만 가능)');
      setFile(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setStatus('uploading');
    setMessage('파일을 n8n으로 전송 중입니다...');

    const formData = new FormData();
    // n8n Binary Data 노드에서 'data'라는 속성 이름을 주로 사용하지만, 
    // 여기서는 일반적인 'file'을 사용합니다. n8n 설정에 맞게 변경 가능합니다.
    formData.append('file', file); 

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        body: formData,
        // fetch가 boundary 헤더를 자동 설정하도록 Content-Type 헤더는 생략합니다.
      });

      if (response.ok) {
        setStatus('success');
        setMessage('파일이 성공적으로 업로드되었습니다!');
        setFile(null); // 업로드 후 초기화
      } else {
        throw new Error('서버 응답 오류');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setStatus('error');
      setMessage(`업로드 실패: ${error.message}. n8n 서버가 실행 중인지 확인하세요.`);
    }
  };

  return (
    <div className="app-container">
      <div className="upload-card">
        <h1 className="title">n8n File Uploader</h1>
        <p className="subtitle">Upload .txt, .pdf, or .csv files directly to your workflow</p>

        <div 
          className={`drop-zone ${status === 'uploading' ? 'disabled' : ''}`}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".txt,.pdf,.csv" 
            hidden 
          />
          
          {file ? (
            <div className="file-info">
              <span className="icon">📄</span>
              <p className="file-name">{file.name}</p>
              <p className="file-size">{(file.size / 1024).toFixed(2)} KB</p>
            </div>
          ) : (
            <div className="placeholder">
              <span className="icon">☁️</span>
              <p>여기를 클릭하거나 파일을 드래그하세요</p>
              <span className="support-text">지원 형식: TXT, PDF, CSV</span>
            </div>
          )}
        </div>

        {status === 'uploading' && <div className="loading-bar"></div>}

        <button 
          className={`upload-btn ${!file || status === 'uploading' ? 'disabled' : ''}`}
          onClick={handleUpload}
          disabled={!file || status === 'uploading'}
        >
          {status === 'uploading' ? '업로드 중...' : '파일 전송하기'}
        </button>

        {message && (
          <div className={`message ${status}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;