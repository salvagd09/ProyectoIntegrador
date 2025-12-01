from fastapi import APIRouter, UploadFile, File, HTTPException
import cloudinary.uploader
from cloudinary_config import cloudinary  

router = APIRouter(
    prefix="/Cloudinary",
    tags=["Cloudinary"]
)

@router.post("/upload-image")
async def upload_image(file: UploadFile = File(...)):
    """
    Realiza el manejo de la lógica de subida de imagen a Cloudinary
    obteniendo la URL 
    """

    # Validar que es un archivo de imagen
    if not file.content_type or not file.content_type.startswith ("image/"):
        raise HTTPException(
            status_code=400,
            detail="Solo se permiten archivos de imagen"
        )
    
    # Validar el tamaño de imagen
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:  # 10 MB
        raise HTTPException(
            status_code=400,
            detail="La imagen excede el límite de 10 MB"
        )

    # Regresar el cursor del archivo
    file.file.seek(0)

    try:
        # Subir a Cloudinary
        result = cloudinary.uploader.upload(
            file.file,
            folder="platillos",
            resource_type="image",
            overwrite=True,
            format="webp"
        )
        
        return {
            "url": result.get("secure_url"),
            "public_id": result.get("public_id")
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
