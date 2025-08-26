# RecuerdaMe

Una aplicación web familiar para compartir recuerdos y mantenerse conectados.

## Características

- **Recuerdos familiares**: Crea y comparte recuerdos con fotos, ubicaciones y personas
- **Mapa familiar**: Ve la ubicación en tiempo real de los miembros de tu familia
- **Recordatorios inteligentes**: Configura recordatorios automáticos para fechas importantes
- **Alertas de ubicación**: Recibe notificaciones cuando los miembros entren o salgan de zonas específicas
- **PWA**: Funciona como una app nativa en dispositivos móviles
- **Notificaciones push**: Mantente informado con notificaciones en tiempo real
- **Modo offline**: Funciona sin conexión a internet
- **Tema claro/oscuro**: Personaliza la apariencia según tus preferencias

## Tecnologías

- **Backend**: Flask 3.0.0 con Python
- **Base de datos**: Firebase Firestore
- **Autenticación**: Firebase Auth
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **PWA**: Service Worker, Web App Manifest
- **Mapas**: Google Maps API
- **Notificaciones**: Firebase Cloud Messaging
- **Despliegue**: Gunicorn + Docker

## Instalación

### Requisitos previos

- Python 3.8+
- Node.js 16+ (para herramientas de desarrollo)
- Cuenta de Firebase
- Google Maps API Key

### Configuración

1. **Clona el repositorio**
   ```bash
   git clone https://github.com/tu-usuario/recuerdame.git
   cd recuerdame
   ```

2. **Instala las dependencias**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configura Firebase**
   - Crea un proyecto en [Firebase Console](https://console.firebase.google.com)
   - Habilita Authentication, Firestore y Cloud Messaging
   - Descarga el archivo `firebase-admin-key.json` y colócalo en la raíz del proyecto
   - Actualiza `firebase.json` con tu configuración

4. **Configura variables de entorno**
   ```bash
   cp .env.example .env
   # Edita .env con tus claves y configuración
   ```

5. **Ejecuta la aplicación**
   ```bash
   python app.py
   ```

   O con Gunicorn:
   ```bash
   gunicorn -c gunicorn.conf.py app:app
   ```

## Estructura del proyecto

```
recuerdame/
├── app.py                          # Aplicación Flask principal
├── requirements.txt                # Dependencias Python
├── gunicorn.conf.py               # Configuración Gunicorn
├── firebase.json                  # Configuración Firebase
├── static/                        # Archivos estáticos
│   ├── css/                       # Estilos CSS modulares
│   │   ├── 00-tokens.css         # Variables CSS
│   │   ├── 01-base.css           # Estilos base
│   │   ├── 02-layout.css         # Layout y grid
│   │   ├── 03-components/        # Componentes UI
│   │   ├── 04-pages/             # Estilos específicos de página
│   │   └── dark.css              # Tema oscuro
│   ├── js/                       # JavaScript modular
│   │   ├── app.js                # App principal y PWA
│   │   ├── ui.js                 # Utilidades de interfaz
│   │   ├── api.js                # Cliente HTTP y API
│   │   ├── auth.js               # Gestión de autenticación
│   │   ├── location.js           # Geolocalización y GPS
│   │   ├── maps.js               # Integración Google Maps
│   │   └── fcm.js                # Notificaciones push
│   ├── icons/                    # Iconos de la PWA
│   ├── manifest.json             # Web App Manifest
│   └── service-worker.js         # Service Worker
└── templates/                     # Templates Jinja2
    ├── base.html                 # Template base
    ├── onboarding.html           # Pantalla de bienvenida
    ├── home.html                 # Página principal
    ├── map.html                  # Mapa familiar
    ├── memories_list.html        # Lista de recuerdos
    ├── memory_person.html        # Detalle de recuerdo
    ├── reminders.html            # Gestión de recordatorios
    ├── alerts.html               # Alertas de ubicación
    ├── family_create.html        # Crear familia
    ├── family_join.html          # Unirse a familia
    └── settings.html             # Configuración
```

## Arquitectura

### CSS Modular
El proyecto utiliza una arquitectura CSS modular basada en tokens de diseño:

- **Tokens (00-tokens.css)**: Variables CSS para colores, espaciado, tipografía
- **Base (01-base.css)**: Reset CSS y estilos fundamentales
- **Layout (02-layout.css)**: Sistema de grid y layouts
- **Components (03-components/)**: Componentes reutilizables (botones, cards, forms)
- **Pages (04-pages/)**: Estilos específicos de cada página
- **Dark theme (dark.css)**: Sobrescribe variables para tema oscuro

### JavaScript Modular
- **app.js**: Inicialización de la app, PWA, gestión de temas
- **ui.js**: Utilidades de interfaz (toasts, modales, animaciones)
- **api.js**: Cliente HTTP con retry, caché y manejo de errores
- **auth.js**: Gestión completa de autenticación y sesiones
- **location.js**: Geolocalización, GPS y zonas de seguridad
- **maps.js**: Integración con Google Maps y temas
- **fcm.js**: Notificaciones push y mensajería

### Backend Flask
- Arquitectura MVC con rutas organizadas
- Integración completa con Firebase
- API RESTful para el frontend
- Manejo de sesiones y autenticación
- Validación de datos y manejo de errores

## Funcionalidades principales

### 👨‍👩‍👧‍👦 Gestión familiar
- Crear y administrar grupos familiares
- Invitar miembros por código o email
- Permisos y roles (administrador, miembro)

### 📸 Recuerdos
- Crear recuerdos con fotos, título, descripción
- Asociar personas y ubicaciones
- Organizar por fechas y categorías
- Búsqueda y filtrado avanzado

### 🗺️ Mapa familiar
- Ubicación en tiempo real de los miembros
- Zonas de seguridad personalizables
- Historial de ubicaciones
- Integración con Google Maps

### ⏰ Recordatorios
- Recordatorios automáticos para cumpleaños
- Aniversarios y fechas importantes
- Recordatorios basados en ubicación
- Notificaciones personalizables

### 🔔 Notificaciones
- Push notifications en tiempo real
- Alertas de seguridad y ubicación
- Notificaciones familiares
- Configuración granular

### 📱 PWA
- Instalable como app nativa
- Funciona offline
- Sincronización en background
- Optimizada para móviles

## Configuración avanzada

### Firebase
```javascript
// firebase.json
{
  "projectId": "tu-proyecto-id",
  "apiKey": "tu-api-key",
  "authDomain": "tu-proyecto.firebaseapp.com",
  "storageBucket": "tu-proyecto.appspot.com",
  "messagingSenderId": "123456789"
}
```

### Google Maps
```python
# En app.py
GOOGLE_MAPS_API_KEY = "tu-google-maps-api-key"
```

### Variables de entorno
```bash
# .env
FLASK_ENV=development
SECRET_KEY=tu-clave-secreta-muy-segura
FIREBASE_PROJECT_ID=tu-proyecto-firebase
GOOGLE_MAPS_API_KEY=tu-clave-google-maps
VAPID_KEY=tu-clave-vapid-para-push
```

## Despliegue

### Docker
```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8000
CMD ["gunicorn", "-c", "gunicorn.conf.py", "app:app"]
```

### Heroku
```bash
# Instalar Heroku CLI y ejecutar:
heroku create tu-app-name
heroku config:set SECRET_KEY=tu-clave-secreta
heroku config:set FIREBASE_PROJECT_ID=tu-proyecto
git push heroku main
```

### Servidor tradicional
```bash
# Con Gunicorn
gunicorn -c gunicorn.conf.py app:app

# Con systemd (crear servicio)
sudo systemctl enable recuerdame
sudo systemctl start recuerdame
```

## Desarrollo

### Ejecutar en modo desarrollo
```bash
export FLASK_ENV=development
python app.py
```

### Comandos útiles
```bash
# Instalar dependencias
pip install -r requirements.txt

# Crear requirements.txt
pip freeze > requirements.txt

# Ejecutar con hot reload
python app.py

# Ejecutar con Gunicorn
gunicorn --reload app:app
```

## Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-caracteristica`)
3. Commit tus cambios (`git commit -am 'Agrega nueva característica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

## Soporte

- 📧 Email: soporte@recuerdame.app
- 🐛 Issues: [GitHub Issues](https://github.com/tu-usuario/recuerdame/issues)
- 📖 Documentación: [Wiki del proyecto](https://github.com/tu-usuario/recuerdame/wiki)

## Roadmap

### v1.1.0 (Próximo)
- [ ] Chat familiar en tiempo real
- [ ] Álbumes compartidos
- [ ] Exportar recuerdos a PDF
- [ ] Integración con redes sociales

### v1.2.0 (Futuro)
- [ ] Reconocimiento facial automático
- [ ] Timeline familiar interactivo
- [ ] Widgets para pantalla de inicio
- [ ] Modo familia extendida

### v2.0.0 (Largo plazo)
- [ ] IA para sugerencias de recuerdos
- [ ] Realidad aumentada
- [ ] Integración con dispositivos IoT
- [ ] Red familiar extendida

---

**RecuerdaMe** - Mantén viva la historia de tu familia 💜
