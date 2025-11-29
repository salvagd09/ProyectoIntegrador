import React, { useState } from 'react';
import { Form, Button, ProgressBar, InputGroup } from 'react-bootstrap';

import styles from '../Modulos/Menu.module.css';

import { API_BASE_URL } from "../Configuracion/api.jsx";

const ImageUploader = ({ onUploadSuccess, currentImageUrl, inputStyle }) => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const [progress, setProgress] = useState(0);
    const [uploadSuccess, setUploadSuccess] = useState(false);

    // Hanlde para manejar la selección del archivo
    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setUploadError(null);
            setProgress(0);
            setUploadSuccess(false);
        }
    };

    // Función que sube el archivo a Cloudinary
    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setUploadError(null);
        setProgress(0);

        try {
            // FormData necesario para enviar archivos a endpoints que usan File o Form
            const formData = new FormData();
            formData.append('file', file);

            const xhr = new XMLHttpRequest();
            
            // Promise para manejar la subida asíncrona con progreso
            const uploadPromise = new Promise((resolve, reject) => {
                xhr.open('POST', `${API_BASE_URL}/Cloudinary/upload-image`);

                xhr.onload = function() {
                    setUploading(false);
                    if (xhr.status === 200) {
                        const result = JSON.parse(xhr.responseText);
                        resolve(result);
                    } else {
                        const errorData = JSON.parse(xhr.responseText);
                        reject(new Error(errorData.detail || `Error al subir la imagen: ${xhr.status}`));
                    }
                };

                xhr.onerror = function() {
                    setUploading(false);
                    reject(new Error('Fallo en la conexión o error de red.'));
                };

                xhr.upload.onprogress = function(event) {
                    if (event.lengthComputable) {
                        const percentComplete = Math.round((event.loaded * 100) / event.total);
                        setProgress(percentComplete);
                    }
                };
                
                xhr.send(formData);
            });

            const result = await uploadPromise;
            
            // Llama a la función del componente padre para pasar la URL
            onUploadSuccess(result.url); 
            setFile(null); // Limpiar el archivo después de subir
            setProgress(100);

            setUploadSuccess(true);

        } catch (error) {
            console.error("Cloudinary Upload Error:", error);
            setUploadError(error.message);
            setProgress(0);
            setUploading(false);
            setUploadSuccess(false);
        }
    };

    // Estilos de ejemplo para el botón de subida
    const btnAccent = { 
        backgroundColor: 'var(--color-accent)', 
        borderColor: 'var(--color-accent)', 
        color: 'white', 
        fontWeight: 'bold' 
    };

    return (
        <Form.Group className="mb-4">
            <Form.Label className={styles.formLabel}>Imagen del Platillo</Form.Label>
            <InputGroup className="mb-2">
                <Form.Control
                    type="file"
                    onChange={handleFileChange}
                    accept="image/*"
                    style={inputStyle}
                    disabled={uploading}
                />
                <Button 
                    onClick={handleUpload}
                    style={btnAccent}
                    disabled={!file || uploading}
                >
                    {uploading ? 'Subiendo...' : 'Subir Imagen'}
                </Button>
            </InputGroup>
            
            {/* Indicador de progreso */}
            {uploading && <ProgressBar now={progress} label={`${progress}%`} className="mb-2 mt-3" />}

            {/* URL actual o Error */}
            {uploadError && <p className="text-danger small">{uploadError}</p>}
            
            {currentImageUrl && (
                <div className="mt-3 d-flex align-items-center">
                    <img 
                        src={currentImageUrl} 
                        alt="Vista previa" 
                        style={{ width: '80px', height: '80px', objectFit: 'cover', marginRight: '10px', borderRadius: '4px' }}
                    />
                    <div>
                        {uploadSuccess ? (
                            <p className="small mb-0 text-success fw-bold">
                                <i className="fa-solid fa-cloud-arrow-up me-2"></i> 
                                Imagen subida y URL guardada con éxito!!!
                            </p>
                        ) : (
                            <p className="small text-muted mb-0">
                                <i className="fa-solid fa-link me-2"></i> 
                                URL actual: {currentImageUrl.substring(0, 40)}...
                            </p>
                        )}
                    </div>
                </div>
            )}
        </Form.Group>
    );
};

export default ImageUploader;