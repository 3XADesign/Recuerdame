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

# Service Worker route
@app.route('/service-worker.js')
def service_worker():
    """Serve service worker from root path"""
    return app.send_static_file('service-worker.js')

# Routes

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
    """List of shared memories/persons"""
    # TODO: Get familyId from session/auth
    family_id = 'demo-family'
    return render_template('memories_list.html', family_id=family_id)

@app.route('/memories/<person_id>')
def memory_person(person_id):
    """Individual person's memory page with photos"""
    # TODO: Get familyId from session/auth
    family_id = 'demo-family'
    return render_template('memory_person.html', person_id=person_id, family_id=family_id)

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

# Memories/Persons API Endpoints
@app.route('/api/persons', methods=['GET'])
def api_get_persons():
    """Get list of persons with optional search and filters"""
    # TODO: Validate auth.uid belongs to familyId
    family_id = request.args.get('familyId')
    q = request.args.get('q', '').lower()  # Search query
    fav = request.args.get('fav')  # Filter favorites
    limit = int(request.args.get('limit', 50))
    cursor = request.args.get('cursor')
    
    if not family_id:
        return jsonify({'error': 'familyId required'}), 400
    
    # TODO: Query Firestore families/{familyId}/persons
    # For now, return mock data
    mock_persons = [
        {
            'id': 'person-1',
            'name': 'Abuela Carmen',
            'relationship': 'abuela',
            'photoUrl': None,
            'favorite': True,
            'createdAt': '2025-08-20T10:00:00Z'
        },
        {
            'id': 'person-2', 
            'name': 'Tío Miguel',
            'relationship': 'tío',
            'photoUrl': None,
            'favorite': False,
            'createdAt': '2025-08-21T15:30:00Z'
        }
    ]
    
    # Client-side filtering for MVP
    filtered_persons = []
    for person in mock_persons:
        # Search filter
        if q and q not in person['name'].lower() and q not in person['relationship'].lower():
            continue
        # Favorites filter  
        if fav == 'true' and not person['favorite']:
            continue
        filtered_persons.append(person)
    
    return jsonify({
        'persons': filtered_persons[:limit],
        'nextCursor': None  # No pagination for MVP
    })

@app.route('/api/persons', methods=['POST'])
def api_create_person():
    """Create new person"""
    # TODO: Validate auth.uid belongs to familyId
    data = request.get_json()
    family_id = data.get('familyId')
    
    if not family_id:
        return jsonify({'error': 'familyId required'}), 400
    
    # Validations
    name = data.get('name', '').strip()
    if not name or len(name) < 2 or len(name) > 60:
        return jsonify({'error': 'name must be 2-60 characters'}), 400
    
    relationship = data.get('relationship', '').strip()
    if len(relationship) > 24:
        return jsonify({'error': 'relationship must be ≤24 characters'}), 400
    
    notes = data.get('notes', '').strip()
    favorite = bool(data.get('favorite', False))
    
    # TODO: Create document in families/{familyId}/persons/{personId}
    import uuid
    person_id = str(uuid.uuid4())
    
    return jsonify({'personId': person_id})

@app.route('/api/persons/<person_id>', methods=['GET'])
def api_get_person(person_id):
    """Get person details with photos"""
    # TODO: Validate auth.uid and fetch from Firestore
    family_id = request.args.get('familyId')
    
    if not family_id:
        return jsonify({'error': 'familyId required'}), 400
    
    # Mock data
    person = {
        'id': person_id,
        'name': 'Abuela Carmen',
        'relationship': 'abuela', 
        'notes': 'Siempre nos contaba historias maravillosas.',
        'photoUrl': None,
        'favorite': True,
        'createdAt': '2025-08-20T10:00:00Z',
        'updatedAt': '2025-08-25T16:20:00Z'
    }
    
    photos = [
        {
            'id': 'photo-1',
            'url': 'https://example.com/photo1.webp',
            'thumbUrl': 'https://example.com/thumb_photo1.webp',
            'caption': 'En el jardín de casa',
            'order': 0,
            'createdAt': '2025-08-20T10:00:00Z'
        }
    ]
    
    return jsonify({
        'person': person,
        'photos': photos
    })

@app.route('/api/persons/<person_id>', methods=['PATCH'])  
def api_update_person(person_id):
    """Update person fields"""
    # TODO: Validate auth.uid and update Firestore
    data = request.get_json()
    family_id = data.get('familyId')
    
    if not family_id:
        return jsonify({'error': 'familyId required'}), 400
    
    # Validate allowed fields
    allowed_fields = ['name', 'relationship', 'notes', 'favorite', 'photoUrl']
    updates = {k: v for k, v in data.items() if k in allowed_fields}
    
    if 'name' in updates:
        name = updates['name'].strip()
        if not name or len(name) < 2 or len(name) > 60:
            return jsonify({'error': 'name must be 2-60 characters'}), 400
    
    if 'relationship' in updates and len(updates['relationship']) > 24:
        return jsonify({'error': 'relationship must be ≤24 characters'}), 400
    
    # TODO: Update families/{familyId}/persons/{personId}
    return jsonify({'ok': True})

@app.route('/api/persons/<person_id>', methods=['DELETE'])
def api_delete_person(person_id):
    """Delete person (soft delete with deletedAt)"""
    # TODO: Validate auth.uid and soft delete in Firestore
    family_id = request.args.get('familyId')
    
    if not family_id:
        return jsonify({'error': 'familyId required'}), 400
    
    # TODO: Add deletedAt timestamp to families/{familyId}/persons/{personId}
    # TODO: Also delete associated photos from Storage
    return jsonify({'ok': True})

@app.route('/api/persons/<person_id>/photos/signed-url', methods=['POST'])
def api_get_photo_signed_url(person_id):
    """Get signed URLs for photo upload"""
    # TODO: Validate auth.uid and generate Cloud Storage signed URLs
    data = request.get_json()
    family_id = data.get('familyId')
    
    if not family_id:
        return jsonify({'error': 'familyId required'}), 400
    
    # TODO: Check person exists and user has access
    # TODO: Check photo count < 6
    
    import uuid
    photo_id = str(uuid.uuid4())
    
    # Mock signed URLs (TODO: replace with real Cloud Storage signed URLs)
    return jsonify({
        'uploadUrl': f'https://storage.googleapis.com/upload/families/{family_id}/persons/{person_id}/{photo_id}.webp',
        'publicUrl': f'https://storage.googleapis.com/families/{family_id}/persons/{person_id}/{photo_id}.webp',
        'thumbUploadUrl': f'https://storage.googleapis.com/upload/families/{family_id}/persons/{person_id}/thumb_{photo_id}.webp',
        'thumbPublicUrl': f'https://storage.googleapis.com/families/{family_id}/persons/{person_id}/thumb_{photo_id}.webp',
        'photoId': photo_id
    })

@app.route('/api/persons/<person_id>/photos', methods=['POST'])
def api_create_photo(person_id):
    """Register photo metadata after upload"""
    # TODO: Validate auth.uid and save to Firestore
    data = request.get_json()
    family_id = data.get('familyId')
    
    if not family_id:
        return jsonify({'error': 'familyId required'}), 400
    
    # Validations
    photo_id = data.get('photoId')
    url = data.get('url')
    thumb_url = data.get('thumbUrl')
    caption = data.get('caption', '').strip()
    order = int(data.get('order', 0))
    
    if len(caption) > 80:
        return jsonify({'error': 'caption must be ≤80 characters'}), 400
    
    if not (photo_id and url and thumb_url):
        return jsonify({'error': 'photoId, url, thumbUrl required'}), 400
    
    # TODO: Create families/{familyId}/persons/{personId}/photos/{photoId}
    return jsonify({'ok': True})

@app.route('/api/persons/<person_id>/photos/<photo_id>', methods=['PATCH'])
def api_update_photo(person_id, photo_id):
    """Update photo caption or order"""
    # TODO: Validate auth.uid and update Firestore
    data = request.get_json()
    family_id = data.get('familyId')
    
    if not family_id:
        return jsonify({'error': 'familyId required'}), 400
    
    updates = {}
    if 'caption' in data:
        caption = data['caption'].strip()
        if len(caption) > 80:
            return jsonify({'error': 'caption must be ≤80 characters'}), 400
        updates['caption'] = caption
    
    if 'order' in data:
        updates['order'] = int(data['order'])
    
    # TODO: Update families/{familyId}/persons/{personId}/photos/{photoId}
    return jsonify({'ok': True})

@app.route('/api/persons/<person_id>/photos/<photo_id>', methods=['DELETE'])
def api_delete_photo(person_id, photo_id):
    """Delete photo from Storage and Firestore"""
    # TODO: Validate auth.uid, delete from Cloud Storage and Firestore
    family_id = request.args.get('familyId')
    
    if not family_id:
        return jsonify({'error': 'familyId required'}), 400
    
    # TODO: Delete from families/{familyId}/persons/{personId}/photos/{photoId}
    # TODO: Delete files from Cloud Storage
    return jsonify({'ok': True})

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
