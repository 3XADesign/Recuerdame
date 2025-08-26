import os
from flask import Flask, render_template, request, jsonify, session, redirect, url_for
import firebase_admin
from firebase_admin import credentials, firestore, auth
import json

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')

# Initialize Firebase Admin SDK (optional for development)
try:
    if not firebase_admin._apps:
        # Try to load Firebase credentials
        firebase_key_path = 'firebase-admin-key.json'
        if os.path.exists(firebase_key_path):
            cred = credentials.Certificate(firebase_key_path)
            firebase_admin.initialize_app(cred)
            db = firestore.client()
            print("✅ Firebase inicializado correctamente")
        else:
            print("⚠️  Firebase key no encontrado - funcionando en modo desarrollo")
            db = None
    else:
        db = firestore.client()
except Exception as e:
    print(f"⚠️  Firebase initialization error: {e}")
    print("📝 Para configurar Firebase:")
    print("   1. Descarga firebase-admin-key.json de Firebase Console")
    print("   2. Colócalo en la raíz del proyecto")
    db = None

@app.route('/')
def home():
    """Landing page for family members with action cards"""
    # TODO: Check authentication and get user data
    user_data = {
        'name': 'María',
        'is_authenticated': True,
        'family_id': 'demo-family'
    }
    return render_template('home.html', user=user_data)

@app.route('/onboarding')
def onboarding():
    """3-screen onboarding flow"""
    return render_template('onboarding.html')

@app.route('/map')
def map_view():
    """Google Maps view with location tracking"""
    # TODO: Get family locations from Firestore
    return render_template('map.html', maps_api_key=os.environ.get('GOOGLE_MAPS_API_KEY'))

@app.route('/memories')
def memories_list():
    """List of shared memories"""
    # TODO: Fetch memories from Firestore
    return render_template('memories_list.html')

@app.route('/memory/<person_id>')
def memory_person(person_id):
    """Individual person's memory page"""
    # TODO: Fetch person data and memories
    return render_template('memory_person.html', person_id=person_id)

@app.route('/reminders')
def reminders():
    """Medication and care reminders"""
    # TODO: Fetch reminders from Firestore
    return render_template('reminders.html')

@app.route('/alerts')
def alerts():
    """Timeline of safety alerts"""
    # TODO: Fetch alerts from Firestore
    return render_template('alerts.html')

@app.route('/family/create')
def family_create():
    """Create new family group"""
    return render_template('family_create.html')

@app.route('/family/join')
def family_join():
    """Join existing family group"""
    return render_template('family_join.html')

@app.route('/settings')
def settings():
    """User settings and preferences"""
    # TODO: Get user data from Firebase Auth
    user_data = {
        'uid': 'demo-user-123',
        'displayName': 'María García',
        'email': 'maria@example.com',
        'phone': '+34 612 345 678',
        'photoUrl': None
    }
    
    # TODO: Get families from Firestore
    families = [
        {'id': 'family-1', 'name': 'Familia García'},
        {'id': 'family-2', 'name': 'Familia Extendida'}
    ]
    
    active_family_id = 'family-1'
    active_family = {
        'id': active_family_id,
        'name': 'Familia García',
        'homeGeopoint': {'lat': 40.4168, 'lng': -3.7038},
        'safeRadiusMeters': 500
    }
    
    i18n = {
        'languages': [
            {'code': 'es', 'name': 'Español'},
            {'code': 'en', 'name': 'English'}
        ]
    }
    
    return render_template('settings.html', 
                         user=user_data,
                         families=families,
                         activeFamilyId=active_family_id,
                         activeFamily=active_family,
                         i18n=i18n)

# API Endpoints
@app.route('/api/family', methods=['POST'])
def api_create_family():
    """Create a new family group"""
    # TODO: Implement family creation logic
    data = request.get_json()
    return jsonify({'success': True, 'family_id': 'demo-family-123'})

@app.route('/api/invite', methods=['POST'])
def api_send_invite():
    """Send family invitation"""
    # TODO: Implement invitation logic
    data = request.get_json()
    return jsonify({'success': True, 'message': 'Invitation sent'})

# Settings API Endpoints
@app.route('/api/profile', methods=['POST'])
def api_update_profile():
    """Update user profile"""
    # TODO: Validate auth.uid and update families/{familyId}/members/{uid}
    data = request.get_json()
    
    # Validations
    if 'displayName' in data and (len(data['displayName']) < 2 or len(data['displayName']) > 60):
        return jsonify({'error': 'Nombre debe tener entre 2 y 60 caracteres'}), 400
    
    # TODO: Update Firestore
    return jsonify({'success': True, 'message': 'Perfil actualizado'})

@app.route('/api/profile/avatar', methods=['POST'])
def api_upload_avatar():
    """Get signed URL for avatar upload"""
    # TODO: Generate signed URL for Firebase Storage
    import uuid
    file_name = f"avatars/{uuid.uuid4()}.jpg"
    
    return jsonify({
        'signedUrl': f'https://storage.googleapis.com/demo-bucket/{file_name}?signed=true',
        'publicUrl': f'https://storage.googleapis.com/demo-bucket/{file_name}'
    })

@app.route('/api/family/settings', methods=['POST'])
def api_update_family_settings():
    """Update family settings (home location, safe radius)"""
    # TODO: Validate auth.uid belongs to familyId
    data = request.get_json()
    
    # Validations
    if 'safeRadiusMeters' in data:
        radius = data['safeRadiusMeters']
        if radius < 100 or radius > 3000:
            return jsonify({'error': 'Radio seguro debe estar entre 100 y 3000 metros'}), 400
    
    if 'homeGeopoint' in data:
        geo = data['homeGeopoint']
        if not (-90 <= geo.get('lat', 0) <= 90) or not (-180 <= geo.get('lng', 0) <= 180):
            return jsonify({'error': 'Coordenadas inválidas'}), 400
    
    # TODO: Update families/{familyId}
    return jsonify({'success': True, 'message': 'Ajustes de familia guardados'})

@app.route('/api/family/switch', methods=['POST'])
def api_switch_family():
    """Switch active family"""
    # TODO: Update members/{uid}.activeFamilyId
    data = request.get_json()
    family_id = data.get('familyId')
    
    return jsonify({'success': True, 'message': f'Cambiado a familia {family_id}'})

@app.route('/api/notifications/subscribe', methods=['POST'])
def api_subscribe_notifications():
    """Subscribe to FCM notifications"""
    # TODO: Save FCM token to members/{uid}.fcmTokens[]
    data = request.get_json()
    fcm_token = data.get('token')
    
    return jsonify({'success': True, 'message': 'Suscrito a notificaciones'})

@app.route('/api/notifications/test', methods=['POST'])
def api_test_notification():
    """Send test notification"""
    # TODO: Send FCM test notification
    return jsonify({'success': True, 'message': 'Notificación de prueba enviada'})

@app.route('/api/invite/code', methods=['GET'])
def api_get_invite_code():
    """Generate or get invite code"""
    # TODO: Create families/{id}/invites/{inviteId} with random code
    import random
    import string
    from datetime import datetime, timedelta
    
    code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    expires_at = (datetime.now() + timedelta(hours=24)).isoformat()
    
    return jsonify({
        'code': code,
        'expiresAt': expires_at,
        'familyName': 'Familia García'
    })

@app.route('/api/account/export', methods=['POST'])
def api_export_account():
    """Export user data (stub)"""
    # TODO: Generate comprehensive user data export
    export_data = {
        'user': {
            'uid': 'demo-user-123',
            'displayName': 'María García',
            'email': 'maria@example.com',
            'exportedAt': '2025-08-26T10:30:00Z'
        },
        'families': ['Familia García'],
        'memories': 42,
        'locations': 1523
    }
    
    return jsonify(export_data)

@app.route('/api/account/delete', methods=['POST'])
def api_delete_account():
    """Delete user account (stub)"""
    # TODO: Implement real account deletion flow
    return jsonify({'message': 'Solicitud de eliminación procesada'}), 202

@app.route('/api/auth/logout', methods=['POST'])
def api_logout():
    """Logout user"""
    # TODO: Clear Firebase Auth session
    session.clear()
    return jsonify({'success': True, 'message': 'Sesión cerrada'})

@app.route('/api/location', methods=['POST'])
def api_update_location():
    """Update user location"""
    # TODO: Store location in Firestore
    data = request.get_json()
    return jsonify({'success': True, 'message': 'Location updated'})

@app.route('/api/last-location')
def api_get_last_location():
    """Get last known location of family member"""
    # TODO: Fetch from Firestore
    return jsonify({
        'latitude': 40.7128,
        'longitude': -74.0060,
        'timestamp': '2025-08-26T10:30:00Z',
        'status': 'safe'
    })

@app.route('/healthz')
def health_check():
    """Health check endpoint for Render"""
    return jsonify({'status': 'healthy', 'timestamp': '2025-08-26T10:30:00Z'})

if __name__ == '__main__':
    # Usar puerto 3000 para evitar conflicto con AirPlay en macOS
    port = int(os.environ.get('PORT', 3000))
    debug_mode = os.environ.get('FLASK_ENV') == 'development'
    
    print(f"🚀 RecuerdaMe iniciando en http://localhost:{port}")
    print(f"🔧 Modo debug: {'activado' if debug_mode else 'desactivado'}")
    
    app.run(host='0.0.0.0', port=port, debug=debug_mode)
