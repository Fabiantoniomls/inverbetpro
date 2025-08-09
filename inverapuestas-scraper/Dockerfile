# 1. Usar la imagen base oficial de Playwright para Python.
# Esta imagen ya incluye Python, Node.js, y los binarios de los navegadores.
# Es importante fijar una versión específica para compilaciones reproducibles.
FROM mcr.microsoft.com/playwright/python:v1.40.0-jammy

# 2. Establecer el directorio de trabajo dentro del contenedor.
WORKDIR /app

# 3. Copiar el archivo de dependencias primero.
# Esto aprovecha el cache de capas de Docker. Si requirements.txt no cambia,
# no se volverán a instalar las dependencias en futuras compilaciones.
COPY requirements.txt .

# 4. Instalar las dependencias de Python.
# --no-cache-dir reduce el tamaño de la imagen final.
RUN pip install --no-cache-dir -r requirements.txt

# 5. Copiar el resto del código de la aplicación al contenedor.
COPY . .

# 6. Definir el comando que se ejecutará cuando se inicie el contenedor.
# Cloud Functions buscará una función llamada 'main' en el archivo 'main.py' por defecto.
# No es necesario un CMD aquí, ya que el punto de entrada es gestionado por el entorno de Cloud Functions.
