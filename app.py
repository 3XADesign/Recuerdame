from flask import Flask, render_template, request, jsonify, session, redirect, url_for, send_from_directory
import firebase_admin
from firebase_admin import credentials, firestore, auth as firebase_auth, storage
from google.cloud.firestore import GeoPoint
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
import uuid

# Cargar variables de entorno
load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')

# Inicializar Firebase Admin
def init_firebase():
    """Inicializa Firebase Admin SDK usando variables de entorno"""
    try:
        # Usar credenciales desde variable de entorno o archivo
        cred_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
        if cred_path and os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
        else:
            # Fallback a archivo local para desarrollo
            cred = credentials.Certificate('instance/firebase.json')
        
        # Configurar con Storage Bucket
        storage_bucket = os.getenv('FIREBASE_STORAGE_BUCKET', 'your-project.appspot.com')
        
        firebase_admin.initialize_app(cred, {
            'storageBucket': storage_bucket
        })
        print("✅ Firebase Admin SDK inicializado correctamente")
        return True
    except Exception as e:
        print(f"❌ Error inicializando Firebase: {e}")
        return False

# Inicializar Firebase
firebase_initialized = init_firebase()
if firebase_initialized:
    db = firestore.client()
else:
    db = None
    print("⚠️ Ejecutando en modo de desarrollo sin Firebase")

# Context processor para inyectar variables globales en templates
@app.context_processor
def inject_global_vars():
    return {
        'GOOGLE_MAPS_API_KEY': os.getenv('GOOGLE_MAPS_API_KEY', 'YOUR_API_KEY_HERE'),
        'current_year': datetime.now().year
    }

# --- RUTAS PRINCIPALES ---

@app.route('/')
def home():
    """Ruta inicial - onboarding si no hay sesión"""
    # TODO: Verificar sesión real con Firebase Auth
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    return render_template('onboarding.html')

@app.route('/dashboard')
def dashboard():
    """Vista principal del mapa para familiares"""
    # TODO: Verificar autenticación y permisos
    # TODO: Obtener datos reales de la familia del usuario
    
    # Datos de ejemplo para desarrollo
    family_data = {
        'familyId': session.get('family_id', 'demo-family'),
        'familyName': 'Familia García',
        'homeLat': 40.4168,  # Madrid
        'homeLng': -3.7038,
        'safeRadius': 500,
        'userName': 'Abuela Carmen'
    }
    
    return render_template('dashboard.html', family=family_data)

# Servir manifest.json
@app.route('/manifest.json')
def manifest():
    return send_from_directory('.', 'manifest.json')

# Servir service worker
@app.route('/service-worker.js')
def service_worker():
    return send_from_directory('.', 'service-worker.js')

@app.route('/memories')
def memories_list():
    """Lista de recuerdos (personas)"""
    return render_template('memories_list.html')

@app.route('/memory/<person_id>')
def memory_person(person_id):
    """Ficha individual de una persona"""
    return render_template('memory_person.html', person_id=person_id)

@app.route('/family/create')
def family_create():
    """Crear nueva familia"""
    return render_template('family_create.html')

@app.route('/family/join')
def family_join():
    """Unirse a familia con código"""
    return render_template('family_join.html')

@app.route('/alerts')
def alerts():
    """Lista de alertas"""
    return render_template('alerts.html')

@app.route('/reminders')
def reminders():
    """Gestión de recordatorios"""
    return render_template('reminders.html')

@app.route('/info-alzheimer')
def info_alzheimer():
    """Información sobre Alzheimer"""
    return render_template('info_alzheimer.html')

# --- API ENDPOINTS ---

@app.route('/api/family', methods=['POST'])
def create_family():
    """Crear nueva familia"""
    if not db:
        return jsonify({'error': 'Firebase no disponible'}), 500
    
    try:
        data = request.get_json()
        
        # Validar datos requeridos
        if not all(k in data for k in ['name', 'lat', 'lng']):
            return jsonify({'error': 'Faltan campos requeridos'}), 400
        
        # Crear documento de familia
        family_ref = db.collection('families').document()
        family_data = {
            'name': data['name'],
            'homeGeopoint': GeoPoint(float(data['lat']), float(data['lng'])),
            'safeRadiusMeters': int(data.get('radius', 500)),
            'createdAt': datetime.utcnow(),
            'ownerUid': session.get('user_id', 'demo-user')  # TODO: usar UID real
        }
        
        family_ref.set(family_data)
        
        # Agregar usuario como miembro admin
        member_ref = family_ref.collection('members').document(session.get('user_id', 'demo-user'))
        member_data = {
            'role': 'admin',
            'displayName': data.get('ownerName', 'Usuario'),
            'email': data.get('email', ''),
            'createdAt': datetime.utcnow(),
            'fcmTokens': []
        }
        member_ref.set(member_data)
        
        return jsonify({
            'success': True,
            'familyId': family_ref.id,
            'message': 'Familia creada exitosamente'
        })
        
    except Exception as e:
        print(f"Error creando familia: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@app.route('/api/invite', methods=['POST'])
def create_invite():
    """Crear código de invitación"""
    if not db:
        return jsonify({'error': 'Firebase no disponible'}), 500
    
    try:
        data = request.get_json()
        family_id = data.get('familyId')
        role = data.get('role', 'familiar')
        
        if not family_id:
            return jsonify({'error': 'familyId requerido'}), 400
        
        # Generar código único de 6 caracteres
        invite_code = str(uuid.uuid4())[:8].upper()
        
        # Crear invitación
        invite_ref = db.collection('families').document(family_id).collection('invites').document()
        invite_data = {
            'code': invite_code,
            'role': role,
            'createdBy': session.get('user_id', 'demo-user'),
            'expiresAt': datetime.utcnow() + timedelta(hours=24),
            'isUsed': False,
            'createdAt': datetime.utcnow()
        }
        
        invite_ref.set(invite_data)
        
        return jsonify({
            'success': True,
            'inviteCode': invite_code,
            'expiresAt': invite_data['expiresAt'].isoformat()
        })
        
    except Exception as e:
        print(f"Error creando invitación: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@app.route('/api/location', methods=['POST'])
def save_location():
    """Guardar ubicación del usuario"""
    if not db:
        return jsonify({'error': 'Firebase no disponible'}), 500
    
    try:
        data = request.get_json()
        
        # Validar datos requeridos
        required_fields = ['familyId', 'uid', 'latitude', 'longitude']
        if not all(k in data for k in required_fields):
            return jsonify({'error': 'Faltan campos requeridos'}), 400
        
        # Crear documento de ubicación
        location_ref = db.collection('families').document(data['familyId']).collection('locations').document()
        location_data = {
            'uid': data['uid'],
            'geopoint': GeoPoint(float(data['latitude']), float(data['longitude'])),
            'accuracy': data.get('accuracy', 0),
            'deviceInfo': request.headers.get('User-Agent', 'Unknown'),
            'createdAt': datetime.utcnow(),
            'isOutsideSafeRadius': data.get('outside', False)
        }
        
        location_ref.set(location_data)
        
        # Si está fuera del radio seguro, crear alerta
        if data.get('outside', False):
            alert_ref = db.collection('families').document(data['familyId']).collection('alerts').document()
            alert_data = {
                'type': 'geofence',
                'message': f"Usuario fuera del área segura - {datetime.utcnow().strftime('%H:%M')}",
                'relatedUid': data['uid'],
                'createdAt': datetime.utcnow(),
                'acknowledgedBy': []
            }
            alert_ref.set(alert_data)
            
            # TODO: Enviar notificación push a familiares
        
        return jsonify({
            'success': True,
            'message': 'Ubicación guardada exitosamente'
        })
        
    except Exception as e:
        print(f"Error guardando ubicación: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@app.route('/api/last-location')
def get_last_location():
    """Obtener última ubicación conocida"""
    if not db:
        # Retornar datos de demo cuando Firebase no está disponible
        return jsonify({
            'success': True,
            'location': {
                'latitude': 40.4168,  # Madrid centro
                'longitude': -3.7038,
                'accuracy': 10,
                'timestamp': datetime.now().isoformat(),
                'isDemo': True
            }
        })
    
    try:
        family_id = request.args.get('familyId')
        uid = request.args.get('uid')
        
        if not family_id or not uid:
            return jsonify({'error': 'familyId y uid requeridos'}), 400
        
        # Buscar última ubicación
        locations_ref = (db.collection('families').document(family_id)
                        .collection('locations')
                        .where('uid', '==', uid)
                        .order_by('createdAt', direction=firestore.Query.DESCENDING)
                        .limit(1))
        
        locations = list(locations_ref.stream())
        
        if not locations:
            return jsonify({'success': False, 'message': 'No hay ubicaciones'})
        
        location_doc = locations[0]
        location_data = location_doc.to_dict()
        
        return jsonify({
            'success': True,
            'location': {
                'latitude': location_data['geopoint'].latitude,
                'longitude': location_data['geopoint'].longitude,
                'accuracy': location_data.get('accuracy', 0),
                'timestamp': location_data['createdAt'].isoformat(),
                'isOutsideSafeRadius': location_data.get('isOutsideSafeRadius', False)
            }
        })
        
    except Exception as e:
        print(f"Error obteniendo ubicación: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@app.route('/healthz')
def health_check():
    """Health check para Render"""
    return 'ok', 200

# --- HELPERS ---

def mock_session():
    """Helper para desarrollo - simula sesión autenticada"""
    if 'user_id' not in session:
        session['user_id'] = 'demo-user-123'
        session['family_id'] = 'demo-family-456'
        session['user_role'] = 'familiar'

# Aplicar mock de sesión en desarrollo
@app.before_request
def before_request():
    # TODO: Reemplazar con autenticación real
    if app.debug and 'user_id' not in session:
        mock_session()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
