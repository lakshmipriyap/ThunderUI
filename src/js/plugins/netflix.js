/** The Netflix plugin provides details on the netflix instance
 */

import Plugin from '../core/plugin.js';
import Monitor from './monitor.js';

class Netflix extends Plugin {

    constructor(pluginData, api) {
        super(pluginData, api);
        this.monitor = undefined;

        this.api.t.on('Netflix', 'visibilitychange', data => {
            if (typeof data.hidden === 'boolean') {
                this.isHidden = data.hidden;

                if (this.rendered === true)
                    this.update();
            }
        });

        this.api.t.on('Netflix', 'statechange', data => {
            if (typeof data.suspended === 'boolean') {
                this.isSuspended = data.suspended;

                if (this.rendered === true)
                    this.update();
            }
        });

        // see if we can init a monitor
        this.api.getControllerPlugins().then( plugins => {
            let _monitorData = plugins.filter( p => {
                if (p.callsign === 'Monitor')
                    return true
                else
                    return false
            });

            if (_monitorData !== undefined)
                this.monitor = new Monitor(_monitorData, this.api);
        });
    }

    render()        {
        var mainDiv = document.getElementById('main');

        mainDiv.innerHTML = `<div class="title grid__col grid__col--8-of-8">
            ESN
        </div>

        <div class="label grid__col grid__col--2-of-8">
            ID
        </div>
        <div id="netflix-esn" class="text grid__col grid__col--6-of-8">
            -
        </div>

        <div id="form-netflix">
            <div id="NetflixMemory" class="memoryInfo"></div>
            <div>
                <div class="title grid__col grid__col--8-of-8">Memory</div>
                <div class="label grid__col grid__col--2-of-8">Current State</div>
                <div id="NetflixStateInfo" class="text grid__col grid__col--6-of-8"></div>
                <div class="label grid__col grid__col--2-of-8"></div>
                <div class="label grid__col grid__col--6-of-8">
                    <button id="NetflixSuspendButton" type="button"></button>
                </div>
            </div>
        </div>`;

        this.interval = setInterval(this.update.bind(this), conf.refresh_interval);
        this.update();

    }

    update(data) {
        var self = this;
        this.status().then( data => {
            if (data.esn)
                document.getElementById('netflix-esn').innerHTML = data.esn;

            var state = data.suspended ? 'Suspended' : 'Resumed';
            var netflixStateEl = document.getElementById('NetflixStateInfo');
            netflixStateEl.innerHTML = state;

            var nextState = 'Suspend';
            if (data.suspended === true) nextState = 'Resume';

            var netflixButton = document.getElementById('NetflixSuspendButton');
            netflixButton.innerHTML = nextState.toUpperCase();
            netflixButton.onclick = this.toggleSuspend.bind(this, nextState);

            // get memory data and div if the monitor plugin is loaded
            if (this.monitor) {
                this.monitor.getMonitorDataAndDiv().then( d => {
                    var memoryDiv = document.getElementById(this.callsign + 'Memory');
                    memoryDiv.innerHTML = '';
                    memoryDiv.appendChild(d);
                });
            }
        });
    }

    close() {
        clearInterval(this.interval);
    }

    toggleSuspend(nextState) {
        var self = this;

        if (nextState === 'Resume') {
            this.resume().then( () => {
                self.update({ suspended : false });
            }).catch(e => {
                self.render();
            });
        } else {
            this.suspend().then( () => {
                self.update({ suspended : true });
            }).catch(e => {
                self.render();
            });
        }
    }
}

export default Netflix;
