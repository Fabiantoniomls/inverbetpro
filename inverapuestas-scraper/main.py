# Este archivo será el punto de entrada para la Google Cloud Function.
# Orquestará el proceso completo:
# 1. Invocará el scraper de tenis.
# 2. Recibirá los datos extraídos.
# 3. Utilizará el FirestoreManager para actualizar la base de datos.
import functions_framework
from scraper.tennis_scraper import extract_daily_tennis_matches
from database.firestore_manager import initialize_firestore, update_daily_matches

# URL del sitio de donde se extraerán los datos.
# Es buena práctica gestionarlo como una variable de entorno.
TARGET_URL = "https://www.flashscore.com/tennis/"

@functions_framework.cloud_event
def daily_scraper_entrypoint(cloud_event):
    """
    Punto de entrada para la Google Cloud Function.
    Se activa por un mensaje de Pub/Sub enviado por Cloud Scheduler.
    """
    print("Iniciando el trabajo diario de scraping de tenis...")

    # 1. Extraer los datos de los partidos
    new_matches = extract_daily_tennis_matches(TARGET_URL)

    if not new_matches:
        print("El scraper no devolvió ningún partido. Finalizando el trabajo.")
        return "No matches found"

    print(f"Scraper finalizado. Se extrajeron {len(new_matches)} partidos.")

    # 2. Conectar a Firestore y persistir los datos
    try:
        db = initialize_firestore()
        update_daily_matches(db, new_matches)
    except Exception as e:
        print(f"Error crítico al interactuar con Firestore: {e}")
        # Considerar enviar una alerta aquí (e.g., a Cloud Logging)
        raise e

    print("Trabajo de scraping y actualización de base de datos completado con éxito.")
    return "OK"
