from enum import Enum
from flask_socketio import join_room, leave_room, close_room

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
        else:
            return False
        return True

    def leave_room(self, sid):
        if self.viewer and self.viewer.sid == sid:
            self.viewer = None
            leave_room(self.room_id)
        elif self.pusher and self.pusher.sid == sid:
            self.pusher = None
            leave_room(self.room_id)
        else:
            return False
        if not self.pusher and not self.viewer:
            close_room(self.room_id)
        return True

    def ready(self):
        return self.viewer != None and self.pusher != None

    def is_empty(self):
        return not self.viewer and not self.pusher
