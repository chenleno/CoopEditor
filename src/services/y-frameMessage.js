import * as time from 'lib0/time'
import * as encoding from 'lib0/encoding'
import * as decoding from 'lib0/decoding'
import * as syncProtocol from 'y-protocols/sync'
import * as awarenessProtocol from 'y-protocols/awareness'
import { Observable } from 'lib0/observable'

const messageSync = 0
const messageQueryAwareness = 3
const messageAwareness = 1

/**
 *                       encoder,          decoder,          provider,          emitSynced, messageType
 * @type {Array<function(encoding.Encoder, decoding.Decoder, FrameMessageProvider, boolean,    number):void>}
 */
const messageHandlers = []

messageHandlers[messageSync] = (encoder, decoder, provider, emitSynced, messageType) => {
  encoding.writeVarUint(encoder, messageSync)
  const syncMessageType = syncProtocol.readSyncMessage(decoder, encoder, provider.doc, provider)
  if (emitSynced && syncMessageType === syncProtocol.messageYjsSyncStep2 && !provider.synced) {
    provider.synced = true
  }
}

messageHandlers[messageQueryAwareness] = (encoder, decoder, provider, emitSynced, messageType) => {
  encoding.writeVarUint(encoder, messageAwareness)
  encoding.writeVarUint8Array(encoder, awarenessProtocol.encodeAwarenessUpdate(provider.awareness, Array.from(provider.awareness.getStates().keys())))
}

messageHandlers[messageAwareness] = (encoder, decoder, provider, emitSynced, messageType) => {
  awarenessProtocol.applyAwarenessUpdate(provider.awareness, decoding.readVarUint8Array(decoder), provider)
}

const readMessage = (provider, buf, emitSynced) => {
  const decoder = decoding.createDecoder(buf)
  const encoder = encoding.createEncoder()
  const messageType = decoding.readVarUint(decoder)
  const messageHandler = provider.messageHandlers[messageType]
  if ( /** @type {any} */ (messageHandler)) {
    messageHandler(encoder, decoder, provider, emitSynced, messageType)
  } else {
    console.error('Unable to compute message')
  }
  return encoder
}

export class FrameMessageProvider extends Observable {
  constructor(roomname, doc, {
    awareness = new awarenessProtocol.Awareness(doc),
    postMessage,
    params = {},
  } = {}) {
    super()
    this.roomname = roomname
    this.doc = doc
    this.awareness = awareness
    this.messageHandlers = messageHandlers.slice()
    this._synced = false
    this.wsLastMessageReceived = 0
    this.messageManager = {}

    this._updateHandler = (update, origin) => {
      if (origin !== this) {
        const encoder = encoding.createEncoder()
        encoding.writeVarUint(encoder, messageSync)
        syncProtocol.writeUpdate(encoder, update)
        this.messageManager.postMessage(encoding.toUint8Array(encoder))
      }
    }
    this.doc.on('update', this._updateHandler)

    this._awarenessUpdateHandler = ({
      added,
      updated,
      removed
    }, origin) => {
      const changedClients = added.concat(updated).concat(removed)
      const encoder = encoding.createEncoder()
      encoding.writeVarUint(encoder, messageAwareness)
      encoding.writeVarUint8Array(encoder, awarenessProtocol.encodeAwarenessUpdate(awareness, changedClients))
      const awarenessData = encoding.toUint8Array(encoder)
      this.messageManager.postMessage(awarenessData)
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        awarenessProtocol.removeAwarenessStates(this.awareness, [doc.clientID], 'window unload')
      })
    }
    awareness.on('update', this._awarenessUpdateHandler)
    this.setUp(postMessage)
  }

  get synced() {
    return this._synced
  }

  set synced(state) {
    if (this._synced !== state) {
      this._synced = state
      this.emit('synced', [state])
      this.emit('sync', [state])
    }
  }

  setUp(sendMessage) {
    this.messageManager = {
      postMessage: data => {
        sendMessage(data)
      }
    }

    this.synced = false
    this.wsLastMessageReceived = time.getUnixTime()
    // always send sync step 1 when connected
    const encoder = encoding.createEncoder()
    encoding.writeVarUint(encoder, messageSync)
    syncProtocol.writeSyncStep1(encoder, this.doc)
    this.messageManager.postMessage(encoding.toUint8Array(encoder))
    // broadcast local awareness state
    if (this.awareness.getLocalState() !== null) {
      const encoderAwarenessState = encoding.createEncoder()
      encoding.writeVarUint(encoderAwarenessState, messageAwareness)
      encoding.writeVarUint8Array(encoderAwarenessState, awarenessProtocol.encodeAwarenessUpdate(this.awareness, [this.doc.clientID]))
      this.messageManager.postMessage(encoding.toUint8Array(encoderAwarenessState))
    }
  }

  onMessage(data) {
    this.wsLastMessageReceived = time.getUnixTime()
    data.forEach(item => {
      const Unit8ArrayData = new Uint8Array({ ...item, length: Object.keys(item).length })
      const encoder = readMessage(this, Unit8ArrayData, true)
      if (encoding.length(encoder) > 1) {
        this.messageManager.postMessage(encoding.toUint8Array(encoder))
      }
    })
  }

  destroy() {
    this.awareness.off('update', this._awarenessUpdateHandler)
    this.doc.off('update', this._updateHandler)
    super.destroy()
  }
}