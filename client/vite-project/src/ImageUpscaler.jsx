import React, { useState } from 'react';
import axios from 'axios';

const ImageUpscaler = () => {
  const [file, setFile] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);

    const formData = new FormData();
    formData.append('image', file);

    try {
      // Expecting a blob (image file) response
      const response = await axios.post('http://localhost:5000/upscale', formData, {
        responseType: 'blob', 
      });

      // Create a URL for the returned image blob
      const imageUrl = URL.createObjectURL(response.data);
      setResultImage(imageUrl);
    } catch (error) {
      console.error("Error uploading file", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={handleUpload} disabled={loading}>
        {loading ? 'Processing...' : 'Upscale Image'}
      </button>

      {resultImage && (
        <div>
          <h3>Result:</h3>
          <img src={resultImage} alt="Upscaled" style={{ maxWidth: '100%' }} />
        </div>
      )}
    </div>
  );
};

export default ImageUpscaler;