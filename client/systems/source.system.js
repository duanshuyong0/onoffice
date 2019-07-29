/*
    This component displays a source. (a source being a screen)
 */
AFRAME.registerSystem('source', {
    assets: null,
    sources: null,

    id: 0,

    init: function() {
        window.setTimeout(() => {
            this.el.systems['webrtc'].onAddStreamFunc = this.onAddStream.bind(this);

            this.el.addEventListener('enter-vr', () => this.showAll());

            this.el.addEventListener('socket-disconnected', () => this.hideAll());
        });
    },

    onAddStream: function(event) {
        let playing = false;

        if(!this.assets) {
            this.assets = document.querySelector('a-assets');
        }

        if(!this.sources) {
            this.sources = document.querySelector('#sources');
        }

        const videoId = `video-${this.id}`;
        this.id++;

        const videoEl = document.createElement('video');
        videoEl.setAttribute('autoplay', '');
        videoEl.setAttribute('class', 'video-source');
        videoEl.setAttribute('id', videoId);
        videoEl.setAttribute('muted', '');

        videoEl.srcObject = event.stream;
        videoEl.onloadedmetadata = () => {
            this.assets.appendChild(videoEl);

            videoEl.onplay = () => {
                playing = true;

                const width = videoEl.videoWidth / 2;
                const height = videoEl.videoHeight / 2;

                const initialScale = 1.3;
                const sizeX = initialScale * (width / height);
                const sizeY = initialScale;
                // const posY = initialScale * this.sources.children.length;
                const posZ = 1 + (this.sources.children.length * .1);

                const screen = document.createElement('a-plane');
                screen.setAttribute('id', `screen-${event.stream.id}`);
                screen.setAttribute('manipulate-source', `streamId: ${event.stream.id}`);
                screen.setAttribute('position', `0 0 ${-posZ}`);
                screen.setAttribute('material', 'shader: flat; height: ' + videoEl.videoHeight + '; width: ' + videoEl.videoWidth);
                screen.setAttribute('scale', `${sizeX} ${sizeY} 1`);

                if (location.search && location.search.indexOf('no-source') >= 0) {
                    screen.setAttribute('color', 'lightgreen');
                } else {
                    screen.setAttribute('src', `#${videoId}`);
                }

                const border = document.createElement('a-plane');
                border.setAttribute('color', '#ff3c4b');
                border.setAttribute('position', '0 0 -.01');
                border.setAttribute('scale', '1.025 1.025 1.025');
                border.setAttribute('source-border', `streamId: ${event.stream.id}`);
                border.setAttribute('visible', 'false');
                screen.appendChild(border);

                const entity = document.createElement('a-entity');
                entity.setAttribute('scale', '1 1 1');
                entity.appendChild(screen);
                this.sources.appendChild(entity);
            };

            videoEl.play();
            setTimeout(() => {
                if (playing) {
                    this.el.sceneEl.dispatchEvent(new Event('source-added'));
                } else {
                    this.el.sceneEl.dispatchEvent(new Event('need-interaction'));
                }
            });
        };
    },

    showAll: function() {
        for (let i = 0; i < this.sources.children.length; i++) {
            this.sources.children[i].setAttribute('animation', 'property: scale; to: 1 1 1');
            setTimeout(() => this.sources.children[i].setAttribute('visible', 'true'), 2000);
        }
    },

    hideAll: function() {
        for (let i = 0; i < this.sources.children.length; i++) {
            this.sources.children[i].setAttribute('animation', 'property: scale; to: 0.0001 1 1');
            setTimeout(() => this.sources.children[i].setAttribute('visible', 'false'), 2000);
        }
    }
});
