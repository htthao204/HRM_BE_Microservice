import socketio

sio = socketio.Client()

@sio.event
def connect():
    print("Connected to server")
    sio.emit('client_message', {'msg': 'Hello from Python client!'})

@sio.event
def server_message(data):
    print("Server says:", data['data'])

@sio.event
def disconnect():
    print("Disconnected from server")

sio.connect('http://192.168.3.104:5000')
sio.wait()
