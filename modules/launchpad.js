const color_map = {
    off: '0x00',
    yellow: '0x15',
    red: '0x63',
    green: '0x60',
};

const state_map = {
    unknown: color_map.yellow,
    active: color_map.red,
    correct: color_map.green,
    wrong: color_map.red,
    done: color_map.off
}

const note_off = '0x0';
const note_on = '0x7f';


function Game(output, input) {
    this.output = output;
    this.input = input;
    this.grid = [];
    this.player1 = { buttons: [], points: 0, picks: 0 };
    this.player2 = { buttons: [], points: 0, picks: 0 };
    this.af = null;
    this.current_turn = '';
    this.active_cell = {};

    this.onMidiMessage = (event) => {
        let event_msg = []
        for (const character of event.data) {
            let msg = `0x${character.toString(16)}`;
            event_msg.push(msg);
        }

        if (event_msg[2] === note_off ) {
            console.log(event_msg, this.current_turn);

            this.updateCell(event_msg[1]);
            this.handlePlayerPicks();
        }

    }
    this.input.onmidimessage = this.onMidiMessage;

    this.updateCell = (cell) => {
        this.grid.forEach((x, i) => {
            if (x.addr === cell) {
                if (this[this.current_turn].picks === 0) {
                    x.state = state_map.active;
                    this.active_cell = x;
                } else { // tb monitored
                    x.state = state_map.active;

                    console.log(x.value, this.active_cell.value);
                    if (x.value === this.active_cell.value) {
                        this[this.current_turn].points++;
                        this[this.current_turn].picks = 0;
                        x.state = color_map.off;
                        this.active_cell.state = color_map.off;
                    } else { // wrong guess, both turn unknown
                        x.state = color_map.yellow;
                        this.active_cell.state = color_map.yellow;
                    }
                }
            }
        });
    }

    this.handlePlayerPicks = () => {
        if (this[this.current_turn].picks < 1) {
            this[this.current_turn].picks++;
        } else if(this[this.current_turn].picks === 1) {
            this[this.current_turn].picks = 0;
            this.current_turn = this.current_turn === 'player1' ? 'player2' : 'player1';
        }
    }

    this.init_grid = () => {
        let grid = [];

        for (let i = 0; i <= 7; i++) {
            for (let j = 0; j <= 7; j++) {
                grid.push({ addr: `0x${j}${i}`, state: state_map.unknown, value: 0 });
            }
        }
        this.grid = grid;
    };

    this.init_players = () => {
        this.player1 = { buttons: [], points: 0, picks: 0 };
        this.player2 = { buttons: [], points: 0, picks: 0 };
        // player button addresses are a bit weird...

        let count_up = [68, 69, '6a', '6b', '6c', '6d', '6e', '6f'];
        for (let i = 0; i <= 7; i++) {
            this.player1.buttons.push({ addr: `0x${count_up[i]}`});
        }

        for (let i = 0; i <= 7; i++) {
            this.player2.buttons.push({ addr: `0x${i}8`});
        }
    };

    this.start_game = () => {
        this.init_grid();
        this.init_players();

        this.grid.forEach(x => {
            this.output.send(this.color_msg(x.addr, color_map.yellow));
        });

        this.current_turn = 'player1';
        this.af = window.requestAnimationFrame(this.gameloop);
        this.gameloop();
    };
    this.gameloop = (dt) => {
        //this.reset();

        this.drawPlayerPoints('player1');
        this.drawPlayerPoints('player2');
        this.drawGrid();

        if (this.current_turn == 'player1') {
            //this.drawPlayerPoints('player1');
        }

        //this.gameloop();
        this.af = window.requestAnimationFrame(this.gameloop);
    };

    this.drawPlayerPoints = (player) => {
        let draw_function = player === "player1" ? 'color_msg_player1' : 'color_msg';

        this[player].buttons.forEach(x => {
            this.output.send(this[draw_function](x.addr, color_map.off));
        })

        this[player].buttons.forEach((elem, index) => {
            if (index < this[player].points) {
                this.output.send(this[draw_function](this[player].buttons[index].addr, color_map.red));
            }

            if (index == this[player].points && this.current_turn === player) {
                this.output.send(this[draw_function](this[player].buttons[index].addr, color_map.green));
            }
        })
    };

    this.reset = () => {
        this.grid.forEach(x => {
             this.output.send(this.color_msg(x.addr, color_map.off));
        });
        this.player1.buttons.forEach(x => {
            this.output.send(this.color_msg_player1(x.addr, color_map.off));
        })
        this.player2.buttons.forEach(x => {
            this.output.send(this.color_msg(x.addr, color_map.off));
        })
    };

    this.drawGrid = () => {
        this.grid.forEach((x, i) => {
            this.output.send(this.color_msg(x.addr, x.state));
        });
    };

    this.color_msg = (addr, color) => {
        return ['0x90', `${addr}`, `${color}`];
    }
    this.color_msg_player1 = (addr, color) => {
        return ['0xb0', `${addr}`, `${color}`];
    }
}


export { Game };
