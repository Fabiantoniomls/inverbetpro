# Este archivo contendrá la lógica principal para el scraping de datos de tenis.
# Utilizará Playwright para navegar por los sitios web, extraer la información de los partidos
# y devolver los datos en un formato estructurado.
import time
import random
from playwright.sync_api import sync_playwright, Page, TimeoutError
from bs4 import BeautifulSoup

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:107.0) Gecko/20100101 Firefox/107.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Safari/605.1.15",
]

def extract_daily_tennis_matches(url: str) -> list[dict]:
    """
    Navega a la URL de partidos de tenis, espera a que el contenido dinámico cargue,
    y extrae los datos de los partidos del día.
    """
    match_data = []
    
    with sync_playwright() as p:
        # --- Configuración de Proxy ---
        # Las credenciales reales deben gestionarse de forma segura, por ejemplo, con Google Secret Manager.
        # PROXY_SERVER = "http://<proxy_provider_endpoint>:<port>"
        # PROXY_USERNAME = "<username>"
        # PROXY_PASSWORD = "<password>"
        # proxy_config = {
        #     "server": PROXY_SERVER,
        #     "username": PROXY_USERNAME,
        #     "password": PROXY_PASSWORD
        # }
        
        # Lanzar el navegador, opcionalmente con la configuración de proxy.
        # browser = p.chromium.launch(headless=True, proxy=proxy_config)
        browser = p.chromium.launch(headless=True) # headless=False para depuración visual
        page = browser.new_page(user_agent=random.choice(USER_AGENTS))

        try:
            print(f"Navegando a {url}...")
            page.goto(url, timeout=60000)

            # --- Estrategia de espera robusta ---
            # Esperar a que el contenedor principal de la tabla de partidos sea visible.
            # Usar un selector específico del sitio de destino.
            print("Esperando a que la tabla de partidos cargue...")
            page.wait_for_selector(".sportName-tennis .event__match", timeout=30000)
            
            # Opcional: añadir una pequeña espera aleatoria para simular comportamiento humano
            time.sleep(random.uniform(1, 3))

            # --- Patrón Híbrido: Playwright para obtener HTML, BeautifulSoup para parsear ---
            print("Contenido cargado. Extrayendo HTML...")
            html_content = page.content()
            doc = BeautifulSoup(html_content, "html.parser")

            # --- Extracción de Datos con Selectores Robustos ---
            # En lugar de clases CSS frágiles, buscar por estructura o roles
            match_rows = doc.select(".event__match--twoLine") # Ejemplo de selector
            
            print(f"Se encontraron {len(match_rows)} partidos.")
            for row in match_rows:
                try:
                    player1_name = row.select_one('.event__participant--home').get_text(strip=True)
                    player2_name = row.select_one('.event__participant--away').get_text(strip=True)
                    
                    # La extracción de cuotas puede requerir selectores más específicos
                    odds_elements = row.select('.event__odd')
                    odd1 = float(odds_elements[0].get_text(strip=True)) if len(odds_elements) > 0 else None
                    odd2 = float(odds_elements[1].get_text(strip=True)) if len(odds_elements) > 1 else None
                    
                    match_time = row.select_one('.event__time').get_text(strip=True)
                    
                    # Para encontrar el nombre del torneo, buscamos hacia atrás en el DOM
                    # hasta encontrar el título del evento que precede a este grupo de partidos.
                    # Esto asume una estructura donde los partidos están agrupados bajo un título.
                    tournament_div = row.find_previous('div', class_='event__title--name')
                    tournament_name = tournament_div.get_text(strip=True) if tournament_div else "Torneo Desconocido"


                    # --- Formateo y Limpieza de Datos ---
                    match_info = {
                        "sport": "tennis",
                        "tournamentName": tournament_name,
                        "matchTimeStr": match_time, # Se procesará a Timestamp más adelante
                        "player1": {"name": player1_name},
                        "player2": {"name": player2_name},
                        "odds": {
                            "bookmakerA": { # Usar un nombre de casa de apuestas real
                                "p1_wins": odd1,
                                "p2_wins": odd2
                            }
                        },
                        "status": "scheduled"
                    }
                    match_data.append(match_info)
                except (AttributeError, IndexError, ValueError) as e:
                    print(f"No se pudo procesar una fila de partido: {e}")
                    continue # Continuar con el siguiente partido

        except TimeoutError:
            print("Error: Timeout esperando a que los elementos cargaran. El sitio puede haber cambiado o estar lento.")
            # Aquí se podría implementar una lógica de reintento
        except Exception as e:
            print(f"Ocurrió un error inesperado durante el scraping: {e}")
        finally:
            browser.close()
            
    return match_data