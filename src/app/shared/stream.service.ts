import {Injectable} from '@angular/core';
import {ElectronService} from 'ngx-electron';
import {SocketService} from './socket.service';
import {SourceSelection} from '../pages/main/settings-screen/source-toggle/source-toggle.component';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';

declare var Peer;

export interface AppStatus {
    current: 'inactive' | 'setting-up' | 'waiting-for-client' | 'active' | 'unable-to-determine-ip';
}

@Injectable()
export class StreamService {
    public statusSubject: BehaviorSubject<AppStatus> = new BehaviorSubject<AppStatus>({ current: 'inactive' });

    private clientId: string;
    private pc: RTCPeerConnection;

    constructor(private electronService: ElectronService, private socketService: SocketService) { }

    public startStreaming(sources: SourceSelection[]) {
        this.statusSubject.next({current: 'active'});
        this.socketService.initialize();

        this.electronService.remote.getGlobal('setWebServerActive')(true);

        this.socketService.emit('host', this.electronService.remote.getGlobal('sessionId'));
        this.socketService.on('client-id', (clientId) => {
            this.clientId = clientId;
            sources.forEach((source) => this.addSource(source))
        });
    }

    public stopStreaming() {
        this.statusSubject.next({current: 'inactive'});
        this.electronService.remote.getGlobal('setWebServerActive')(false);

        this.socketService.emit('stop-streaming');
        this.socketService.removeAllListeners('start');

        if (this.pc) {
            this.pc.close();
        }
    }

    public async addSource(source: SourceSelection) {
        const n = <any>navigator;
        const stream = await n.mediaDevices.getUserMedia({
            audio: false,
            video: {
                mandatory: {
                    chromeMediaSource: 'desktop',
                    chromeMediaSourceId: source.source.id,
                },
            }
        });
        source.streamId = stream.id;

        if (source.type === 'screen') {
            this.electronService.remote.require('./components/virtual-cursor.component').registerDisplay(source.source.id, stream.id);
        }

        const peer = new Peer(null, {
            host: 'localhost',
            port: 24242,
            path: '/peerjs'
        });

        peer.on('open', () => {
            const call = peer.call(this.clientId, stream);

            // call.on('close', () => {
            //     this.statusSubject.next({ current: 'waiting-for-client' });
            // });

            this.statusSubject.next({ current: 'active' });
        });

        peer.on('error', (error) => {
            console.error('Connection error', error);
        });
    }
}
