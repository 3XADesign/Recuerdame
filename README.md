# RecuerdaMe 📱

Una aplicación web progresiva (PWA) diseñada para ayudar a las familias de personas con Alzheimer a mantener la conexión, seguridad y bienestar de sus seres queridos.

## 🎯 Objetivo

RecuerdaMe está diseñada con principios de **diseño centrado en personas mayores**, ofreciendo una interfaz simple, accesible y funcional que permite:

- **Seguimiento de ubicación en tiempo real** con geovallas de seguridad
- **Gestión familiar colaborativa** con invitaciones y permisos
- **Recordatorios inteligentes** para medicamentos y actividades
- **Archivo de memorias** para preservar momentos importantes
- **Sistema de alertas** para situaciones de emergencia
- **Comunicación familiar** centralizada

## 🛠️ Tecnologías

### Backend
- **Python Flask** - Framework web ligero y flexible
- **Firebase Admin SDK** - Autenticación y base de datos
- **Google Cloud Firestore** - Base de datos NoSQL en tiempo real
- **Firebase Cloud Messaging** - Notificaciones push

### Frontend
- **HTML5 + CSS3** - Estructura y estilos
- **Bootstrap 5** - Framework CSS responsivo
- **JavaScript Vanilla** - Sin dependencias pesadas
- **Google Maps JavaScript API** - Mapas y geolocalización
- **Progressive Web App (PWA)** - Instalable en dispositivos

### Despliegue
- **Render** - Plataforma de hosting
- **Gunicorn** - Servidor WSGI para producción

## 📁 Estructura del Proyecto

```
RecuerdaMe/
├── app.py                    # Aplicación Flask principal
├── requirements.txt          # Dependencias Python
├── render.yaml              # Configuración de Render
├── manifest.json            # Manifiesto PWA
├── service-worker.js        # Service Worker PWA
├── templates/               # Plantillas Jinja2
│   ├── base.html           # Plantilla base
│   ├── dashboard.html      # Panel principal con mapa
│   ├── family.html         # Gestión familiar
│   ├── memories.html       # Archivo de memorias
│   ├── reminders.html      # Recordatorios
│   ├── alerts.html         # Centro de alertas
│   ├── settings.html       # Configuración
│   ├── login.html          # Inicio de sesión
│   └── onboarding.html     # Proceso de incorporación
└── static/
    ├── css/
    │   └── styles.css      # Estilos personalizados
    ├── js/
    │   ├── app.js          # Lógica principal
    │   ├── maps.js         # Integración Google Maps
    │   ├── location.js     # Geolocalización y seguimiento
    │   └── fcm.js          # Notificaciones push
    └── img/
        ├── icon.png        # Icono PWA 192x192
        └── icon-512.png    # Icono PWA 512x512
```

## ⚡ Características Principales

### 🗺️ Dashboard con Mapa Interactivo
- Visualización en tiempo real de ubicaciones familiares
- Geovallas de seguridad configurables
- Historial de ubicaciones
- Alertas automáticas por proximidad

### 👨‍👩‍👧‍👦 Gestión Familiar
- Sistema de invitaciones por código
- Roles y permisos diferenciados
- Perfil de la persona con Alzheimer
- Contactos de emergencia

### 🔔 Sistema de Recordatorios
- Medicamentos con horarios específicos
- Actividades diarias
- Citas médicas
- Notificaciones push inteligentes

### 📸 Archivo de Memorias
- Fotos con descripciones
- Momentos importantes
- Compartir con la familia
- Estímulo para la memoria

### 🚨 Centro de Alertas
- Notificaciones de geovalla
- Alertas de emergencia
- Estado de medicamentos
- Comunicación familiar

## 🚀 Instalación y Configuración

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/RecuerdaMe.git
cd RecuerdaMe
```

### 2. Configurar entorno virtual
```bash
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
```

### 3. Instalar dependencias
```bash
pip install -r requirements.txt
```

### 4. Configurar Firebase

#### A. Crear proyecto Firebase
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto
3. Habilita Authentication, Firestore y Cloud Messaging

#### B. Configurar variables de entorno
Crea un archivo `.env` en la raíz del proyecto:

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=tu-project-id
FIREBASE_PRIVATE_KEY_ID=tu-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\ntu-private-key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=tu-service-account@tu-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=tu-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token

# Google Maps API
GOOGLE_MAPS_API_KEY=tu-google-maps-api-key

# App Configuration
SECRET_KEY=tu-secret-key-super-segura
```

### 5. Configurar Google Maps API
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Habilita la Google Maps JavaScript API
3. Crea una clave API y configúrala en las variables de entorno

### 6. Ejecutar la aplicación
```bash
python app.py
```

La aplicación estará disponible en `http://localhost:5000`

## 🌐 Despliegue en Render

### 1. Conectar repositorio
1. Ve a [Render](https://render.com/)
2. Conecta tu repositorio de GitHub
3. Selecciona "Web Service"

### 2. Configurar variables de entorno
En el dashboard de Render, configura todas las variables del archivo `.env`

### 3. Despliegue automático
El archivo `render.yaml` ya está configurado para el despliegue automático.

## 📱 Características PWA

### Instalación
- **Android**: "Agregar a pantalla de inicio"
- **iOS**: "Agregar a pantalla de inicio" desde Safari
- **Desktop**: Icono de instalación en la barra de direcciones

### Funcionalidad Offline
- Caché de recursos estáticos
- Página offline personalizada
- Sincronización en segundo plano (próximamente)

### Notificaciones Push
- Alertas de geovalla
- Recordatorios de medicamentos
- Notificaciones familiares

## 🎨 Diseño Centrado en Personas Mayores

### Principios de Accesibilidad
- **Fuentes grandes** (mínimo 18px)
- **Alto contraste** para mejor visibilidad
- **Botones grandes** fáciles de tocar
- **Navegación simple** e intuitiva
- **Iconos claros** con texto descriptivo

### Características Específicas
- Modo alto contraste
- Tamaño de fuente ajustable
- Confirmaciones claras para acciones importantes
- Mensajes de error comprensibles
- Ayuda contextual disponible

## 🔐 Seguridad y Privacidad

### Datos Protegidos
- Autenticación Firebase segura
- Cifrado de datos en tránsito y reposo
- Acceso basado en roles familiares
- Logs de actividad para auditoría

### Privacidad
- Datos de ubicación solo para familia autorizada
- Configuración granular de privacidad
- Eliminación de datos bajo solicitud
- Cumplimiento con regulaciones de privacidad

## 📊 Base de Datos (Firestore)

### Colecciones Principales

#### `families`
```javascript
{
  id: "family_id",
  name: "Familia García",
  created_at: timestamp,
  settings: {
    emergency_contacts: [],
    notification_preferences: {}
  }
}
```

#### `members`
```javascript
{
  id: "member_id",
  family_id: "family_id",
  email: "usuario@email.com",
  name: "Juan García",
  role: "admin|caregiver|viewer",
  created_at: timestamp
}
```

#### `persons`
```javascript
{
  id: "person_id",
  family_id: "family_id",
  name: "María García",
  birth_date: "1945-03-15",
  medical_info: {},
  emergency_contacts: [],
  geofences: []
}
```

#### `locations`
```javascript
{
  id: "location_id",
  person_id: "person_id",
  latitude: 40.7128,
  longitude: -74.0060,
  accuracy: 10,
  timestamp: timestamp,
  is_inside_geofence: true
}
```

## 🤝 Contribuir

### Reportar Problemas
1. Verifica que el problema no exista ya
2. Crea un issue detallado
3. Incluye pasos para reproducir

### Desarrollo
1. Fork el repositorio
2. Crea una rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crea un Pull Request

## 📋 TODO / Roadmap

### MVP1 (Actual)
- [x] ✅ Estructura básica Flask + Firebase
- [x] ✅ Autenticación de usuarios
- [x] ✅ Dashboard con Google Maps
- [x] ✅ Gestión familiar básica
- [x] ✅ PWA con service worker
- [ ] 🔄 Despliegue en Render
- [ ] 🔄 Pruebas de integración

### MVP2 (Próximo)
- [ ] 📱 Chat familiar en tiempo real
- [ ] 🔔 Sistema de recordatorios completo
- [ ] 📊 Dashboard de estadísticas
- [ ] 🎯 Geofencing avanzado
- [ ] 📞 Integración con llamadas de emergencia

### Futuro
- [ ] 🤖 IA para detección de patrones
- [ ] 📈 Análisis predictivo de comportamiento
- [ ] 🩺 Integración con dispositivos médicos
- [ ] 🌍 Soporte multi-idioma
- [ ] 📱 Apps nativas móviles

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🙏 Agradecimientos

- Familias que inspiraron este proyecto
- Comunidad de cuidadores de Alzheimer
- Desarrolladores de las tecnologías open source utilizadas
- Equipo de diseño UX especializado en accesibilidad

## 📞 Soporte

Para soporte técnico o consultas:
- **Email**: soporte@recuerdame.app
- **Issues**: [GitHub Issues](https://github.com/tu-usuario/RecuerdaMe/issues)
- **Documentación**: [Wiki del proyecto](https://github.com/tu-usuario/RecuerdaMe/wiki)

---

**RecuerdaMe** - *Mantén a tu familia unida y segura* 💙
