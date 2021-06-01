from enum import Enum
from flask import Flask, request, render_template
from flask_socketio import SocketIO, emit, join_room, leave_room

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins='*')

class Role(Enum):
    viewer = 1
    pusher = 2

class Attender:
    def __init__(self, role, sid):
        if isinstance(role, Role):
            self.role = role
            self.sid = sid

class Room:
    def __init__(self, room_id):
        self.room_id = room_id
        self.viewer = None
        self.pusher = None
    
    def join_room(self, attender):
        if attender.role == Role.viewer and not self.viewer:
            self.viewer = attender
            join_room(self.room_id)
        elif attender.role == Role.pusher and not self.pusher:
            self.pusher = attender
            join_room(self.room_id)

    def leave_room(self, attender):
        if attender == self.viewer:
            self.viewer = None
            leave_room(self.room_id)
        elif attender == self.pusher:
            self.pusher = None
            leave_room(self.room_id)
        if not self.viewer and not self.pusher:
            del room_map[self.room_id]
    
    def ready(self):
        return self.viewer != None and self.pusher != None

room_map = {}


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
    room.join_room(attender)
    if room.ready:
        emit('ready', to=room.room_id, include_self=True)

# Simply pass the data to the receiver
@socketio.on('data')
def handle_data(data):
    room_id = data['room_id']
    if room_map.get(room_id, None):
        emit('data', data, to=room_id, include_self=False)

if __name__ == '__main__':
    socketio.run(app, debug=True)
