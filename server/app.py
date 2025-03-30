from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
from datetime import datetime
from dotenv import load_dotenv
import os
from flask_mail import Mail, Message
from flask import send_from_directory
from flask_socketio import SocketIO, emit

socketio = SocketIO(app, cors_allowed_origins="*")

@app.route('/api/bills/<id>', methods=['PUT'])
def update_bill(id):
    # ... your existing update logic
    socketio.emit('bill-updated', updated_bill)
    return jsonify(updated_bill)

load_dotenv()

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

app = Flask(__name__)
CORS(app)

# MongoDB setup
mongo_uri = os.getenv('MONGO_URI')
client = MongoClient(mongo_uri)
db = client.bill_reminder_db

# Email configuration
app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER')
app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT'))
app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS') == 'True'
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
mail = Mail(app)

# Configure Flask-Mail properly in app.py
app.config['MAIL_SERVER'] = 'smtp.gmail.com'  # For Gmail
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'your@gmail.com'
app.config['MAIL_PASSWORD'] = 'your-app-password'  # Use App Password for Gmail

# Routes for Bills
@app.route('/api/bills', methods=['GET'])
def get_bills():
    status = request.args.get('status', 'all')
    query = {}
    
    if status == 'upcoming':
        query = {'due_date': {'$gte': datetime.now()}, 'paid': False}
    elif status == 'overdue':
        query = {'due_date': {'$lt': datetime.now()}, 'paid': False}
    elif status == 'paid':
        query = {'paid': True}
    
    bills = list(db.bills.find(query).sort('due_date', 1))
    for bill in bills:
        bill['_id'] = str(bill['_id'])
    return jsonify(bills)

@app.route('/api/bills', methods=['POST'])
def add_bill():
    data = request.json
    data['due_date'] = datetime.strptime(data['due_date'], '%Y-%m-%d')
    data['paid'] = False
    result = db.bills.insert_one(data)
    return jsonify({'id': str(result.inserted_id)}), 201

@app.route('/api/bills/<id>', methods=['PUT'])
def update_bill(id):
    data = request.json
    if 'due_date' in data:
        data['due_date'] = datetime.strptime(data['due_date'], '%Y-%m-%d')
    db.bills.update_one({'_id': id}, {'$set': data})
    return jsonify({'message': 'Bill updated successfully'})

@app.route('/api/bills/<id>', methods=['DELETE'])
def delete_bill(id):
    db.bills.delete_one({'_id': id})
    return jsonify({'message': 'Bill deleted successfully'})

@app.route('/api/bills/<id>/pay', methods=['PUT'])
def mark_as_paid(id):
    db.bills.update_one({'_id': id}, {'$set': {'paid': True}})
    return jsonify({'message': 'Bill marked as paid'})

# Routes for Reminders
@app.route('/api/reminders', methods=['POST'])
def create_reminder():
    data = request.json
    data['created_at'] = datetime.now()
    result = db.reminders.insert_one(data)
    
    # Send email notification if enabled
    if data.get('send_email'):
        bill = db.bills.find_one({'_id': data['bill_id']})
        msg = Message('Bill Reminder',
                      sender=app.config['MAIL_USERNAME'],
                      recipients=[data['email']])
        msg.body = f"Reminder: Your bill {bill['name']} is due on {bill['due_date'].strftime('%Y-%m-%d')}"
        mail.send(msg)
    
    return jsonify({'id': str(result.inserted_id)}), 201

if __name__ == '__main__':
    app.run(debug=True)