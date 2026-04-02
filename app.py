from flask import Flask, request, jsonify, send_from_directory
from database import init_db, create_chat, save_message, get_chats, get_chat_messages, rename_chat, delete_chat, toggle_pin
from llm_service import analyze_symptoms_multi, MODEL_NAME
import os

app = Flask(__name__, static_folder='static')

init_db()

@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/check-symptoms', methods=['POST'])
def check_symptoms():
    data = request.get_json()
    if not data or 'symptoms' not in data:
        return jsonify({'error': 'Symptoms not provided'}), 400
    
    symptoms = data['symptoms']
    chat_id = data.get('chatId')  # None if new chat
    
    if not symptoms.strip():
        return jsonify({'error': 'Symptom text cannot be empty'}), 400

    db_history = []
    
    # If no chatId is provided, initialize a brand new chat sequence
    if not chat_id:
        words = symptoms.split()
        title = ' '.join(words[:5])
        if len(words) > 5: title += '...'
        
        chat_id = create_chat(title)
    else:
        # Load previous history to feed model
        db_history = get_chat_messages(chat_id)

    # Save the user's message
    save_message(chat_id, 'user', symptoms)

    # Query LLM
    conditions_response = analyze_symptoms_multi(symptoms, db_history)
    
    # Save AI's response
    save_message(chat_id, 'ai', conditions_response)
    
    return jsonify({
        'chatId': chat_id,
        'symptoms': symptoms,
        'analysis': conditions_response
    })

@app.route('/api/history', methods=['GET'])
def history():
    return jsonify(get_chats())

@app.route('/api/history/<int:chat_id>', methods=['GET'])
def get_single_chat(chat_id):
    messages = get_chat_messages(chat_id)
    return jsonify(messages)

@app.route('/api/history/<int:chat_id>', methods=['DELETE'])
def delete_single_history(chat_id):
    delete_chat(chat_id)
    return jsonify({'status': 'success'})

@app.route('/api/history/<int:chat_id>', methods=['PUT', 'PATCH'])
def rename_single_history(chat_id):
    data = request.get_json()
    new_title = data.get('title', '').strip()
    if not new_title:
        return jsonify({'error': 'Title cannot be empty'}), 400

    rename_chat(chat_id, new_title)
    return jsonify({'status': 'success', 'title': new_title})

@app.route('/api/history/<int:chat_id>/pin', methods=['PATCH'])
def pin_single_history(chat_id):
    toggle_pin(chat_id)
    return jsonify({'status': 'success'})

@app.route('/api/config', methods=['GET'])
def get_config():
    return jsonify({'model': MODEL_NAME})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
