from flask import Flask, request, render_template
from flask_socketio import SocketIO, emit
from object import Role, Attender, Room

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins='*')

room_map = {}
client_to_room_map = {}

# @app.route('/')
# def index():
#     return render_template('index.html')

@socketio.on('connect')
def handle_connect():
    print('connected')
    emit('connected', {'data': 'connected'})

# View page is the one that will visualize the ml results
# Push page only push the video stream
# They both join the same room
@socketio.on('join')
def handle_join(data):
    print('client joined')
    role = data['role'] # viewer or pusher
    role = Role[role]
    sid = request.sid
    attender = Attender(role, sid)
    room_id = data['room_id']
    room = room_map.get(room_id, None)
    if not room:
        room = Room(room_id)
        room_map[room_id] = room
    if room.join_room(attender):
        client_to_room_map[sid] = room
    if room.ready():
        print('room is ready')
        emit('ready', to=room.room_id, include_self=True)

@socketio.on('disconnect')
def handle_disconnect():
    sid = request.sid
    room = client_to_room_map.get(sid, None)
    if room:
        if room.leave_room(sid):
            print(f'client {sid} left room {room}')
            del client_to_room_map[sid]
        if room.is_empty():
            print(f'empty room {room.room_id}')
            del room_map[room.room_id]
        else:
            print('send peer left signal')
            emit('peer_left', to=room.room_id, include_self=False)

# Simply pass the data to the receiver
@socketio.on('data')
def handle_data(data):
    sid = request.sid
    room = client_to_room_map.get(sid, None)
    if room:
        emit('data', data, to=room.room_id, include_self=False)

if __name__ == '__main__':
    socketio.run(app, debug=True)
