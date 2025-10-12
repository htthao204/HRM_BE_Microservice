from flask import Flask
from flask_socketio import SocketIO, emit

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

@socketio.on('connect')
def on_connect():
    print("Client connected")
    emit('server_message', {'data': 'Welcome!'})

@socketio.on('client_message')
def handle_message(data):
    print("Client sent:", data)
    emit('server_message', {'data': f"Server received: {data['msg']}"})

if __name__ == '__main__':
    socketio.run(app, host="0.0.0.0", port=5000)
