# Este módulo gestionará todas las interacciones con la base de datos Firestore.
# Se encargará de conectar con la base de datos, borrar los datos antiguos
# y escribir los nuevos datos extraídos por el scraper de forma atómica.
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime, timedelta, timezone

def initialize_firestore():
    """Inicializa la conexión con Firestore si no ha sido inicializada."""
    if not firebase_admin._apps:
        # En un entorno de producción como Cloud Functions, las credenciales
        # se pueden manejar automáticamente a través de la variable de entorno
        # GOOGLE_APPLICATION_CREDENTIALS o el servicio de metadatos.
        cred = credentials.ApplicationDefault()
        firebase_admin.initialize_app(cred)
    
    return firestore.client()

def update_daily_matches(db, new_matches: list[dict]):
    """
    Realiza una actualización atómica de los partidos diarios.
    1. Borra todos los partidos 'scheduled' existentes.
    2. Añade los nuevos partidos extraídos.
    Todo dentro de una única escritura por lotes.
    """
    if not new_matches:
        print("No se proporcionaron nuevos partidos para actualizar.")
        return

    print("Iniciando actualización atómica de partidos...")
    batch = db.batch()

    # --- Paso 1: Identificar y borrar los partidos antiguos ---
    # Se borran solo los partidos programados para evitar eliminar partidos
    # históricos que el usuario pueda haber guardado.
    matches_ref = db.collection('matches')
    old_matches_query = matches_ref.where('status', '==', 'scheduled')
    docs_to_delete = old_matches_query.stream()

    delete_count = 0
    for doc in docs_to_delete:
        batch.delete(doc.reference)
        delete_count += 1
    
    print(f"{delete_count} partidos antiguos marcados para eliminación.")

    # --- Paso 2: Añadir los nuevos partidos ---
    # Procesar y añadir cada nuevo partido al lote
    add_count = 0
    for match in new_matches:
        # Enriquecer el documento con metadatos
        match['scrapedAt'] = datetime.now(timezone.utc)
        
        # Crear un ID de documento único y predecible
        tournament_safe = match['tournamentName'].lower().replace(' ', '-')
        p1_safe = match['player1']['name'].lower().replace(' ', '-')
        p2_safe = match['player2']['name'].lower().replace(' ', '-')
        doc_id = f"tennis-{tournament_safe}-{p1_safe}-vs-{p2_safe}"
        
        doc_ref = matches_ref.document(doc_id)
        batch.set(doc_ref, match)
        add_count += 1
        
    print(f"{add_count} nuevos partidos marcados para ser añadidos.")

    # --- Paso 3: Ejecutar la operación atómica ---
    try:
        batch.commit()
        print("¡Escritura por lotes completada con éxito! La base de datos ha sido actualizada atómicamente.")
    except Exception as e:
        print(f"Error al ejecutar la escritura por lotes: {e}")
        # La base de datos permanece en su estado anterior, sin cambios.
