import sqlite3
import os

DB_FILE = 'symptom_checker.sqlite'

def get_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    # Enable foreign keys
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db():
    conn = get_connection()
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS chats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            chat_id INTEGER NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(chat_id) REFERENCES chats(id) ON DELETE CASCADE
        )
    ''')
    
    # Gracefully attempt to add new pinning column to support upgrades without wiping data
    try:
        c.execute('ALTER TABLE chats ADD COLUMN is_pinned BOOLEAN DEFAULT 0')
    except sqlite3.OperationalError:
        pass # Column already exists
    
    conn.commit()
    conn.close()

def create_chat(title):
    conn = get_connection()
    c = conn.cursor()
    c.execute('INSERT INTO chats (title) VALUES (?)', (title,))
    chat_id = c.lastrowid
    conn.commit()
    conn.close()
    return chat_id

def save_message(chat_id, role, content):
    conn = get_connection()
    c = conn.cursor()
    c.execute('INSERT INTO messages (chat_id, role, content) VALUES (?, ?, ?)', (chat_id, role, content))
    conn.commit()
    conn.close()

def get_chats():
    conn = get_connection()
    c = conn.cursor()
    c.execute('SELECT * FROM chats ORDER BY timestamp DESC LIMIT 50')
    rows = c.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_chat_messages(chat_id):
    conn = get_connection()
    c = conn.cursor()
    c.execute('SELECT * FROM messages WHERE chat_id = ? ORDER BY timestamp ASC', (chat_id,))
    rows = c.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def rename_chat(chat_id, new_title):
    conn = get_connection()
    c = conn.cursor()
    c.execute('UPDATE chats SET title = ? WHERE id = ?', (new_title, chat_id))
    conn.commit()
    conn.close()

def toggle_pin(chat_id):
    conn = get_connection()
    c = conn.cursor()
    c.execute('UPDATE chats SET is_pinned = CASE WHEN is_pinned = 1 THEN 0 ELSE 1 END WHERE id = ?', (chat_id,))
    conn.commit()
    conn.close()

def delete_chat(chat_id):
    conn = get_connection()
    c = conn.cursor()
    c.execute('DELETE FROM chats WHERE id = ?', (chat_id,))
    conn.commit()
    conn.close()
