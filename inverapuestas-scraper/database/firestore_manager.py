# Este módulo gestionará todas las interacciones con la base de datos Firestore.
# Se encargará de conectar con la base de datos, borrar los datos antiguos
# y escribir los nuevos datos extraídos por el scraper de forma atómica.
import firebase_admin
from firebase_admin import credentials, firestore

def initialize_firestore():
    """Inicializa la conexión con Firestore si no ha sido inicializada."""
    if not firebase_admin._apps:
        # En un entorno de producción como Cloud Functions, las credenciales
        # se pueden manejar automáticamente a través de la variable de entorno
        # GOOGLE_APPLICATION_CREDENTIALS o el servicio de metadatos.
        cred = credentials.ApplicationDefault()
        firebase_admin.initialize_app(cred)
    
    return firestore.client()
