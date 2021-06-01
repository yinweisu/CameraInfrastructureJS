# WebRTC

### Signal Server

* Server provides ways for the caller and callee to communicate. Server does not need to know the content of communication
* communicate process
  1. Pusher and viewer both join the server room
  2. Server norifies room ready
  3. Pusher creates offer that contains ICE Event and sdp string. Sends the offer to the viewer through signal server
  4. Viewer receives the offer, creates a remote config and an answer. Sends the answer to the pusher through signal server
  5. Pusher receives the answer, creates a remote config and starts streaming

### SDP

SDP(Session Description Protocol) contains information about codec, source address, and timing info of audio and video

### ICE Negotiation

An ICE candidate describes a method that the sending peer is able to use to communicate. Each peer sends candidates in the order they're discovered, and keeps sending candidates until it runs out of suggestions, even if media has already started streaming.

Once the two peers agree upon a mutually-compatible candidate, that candidate's SDP is used by each peer to construct and open a connection, through which media then begins to flow.

Each side sends candidates to the other as it receives them from their local ICE layer; there is no taking turns or batching of candidates. As soon as the two peers agree upon one candidate that they can both use to exchange the media, media begins to flow. Each peer continues to send candidates until it runs out of options, even after the media has already begun to flow. This is done in hopes of identifying even better options than the one initially selected.

### Offer

Offer includes a list of supported configurations for the connection, including information about the media stream we've added to the connection locally (that is, the video we want to send to the other end), and any ICE candidates gathered by the ICE layer already

**New ICE candidate could be discovered after the offer; hence, needs to be sent to the other separately**

### TURN Server

