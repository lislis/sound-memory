const color_map = {
    off: '0x00',
    yellow: '0x15',
    red: '0x63',
    green: '0x60',
};

function Game(output, input) {
    this.output = output;
    this.input = input;
    this.grid = [];
    this.player1 = { buttons: [], points: 7, picks: 0 };
    this.player2 = { buttons: [], points: 0, picks: 0 };
    this.af = null;
    this.current_turn = '';

    this.init_grid = () => {
        let grid = [];

        for (let i = 0; i <= 7; i++) {
            for (let j = 0; j <= 7; j++) {
                grid.push({ addr: `0x${j}${i}` });
            }
        }
        this.grid = grid;
    };

    this.init_players = () => {
        this.player1 = { buttons: [], points: 2, picks: 0 };
        this.player2 = { buttons: [], points: 3, picks: 0 };
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
    };
    this.gameloop = (dt) => {
        this.reset();

        this.drawPlayerPoints('player1');
        this.drawPlayerPoints('player2');

        if (this.current_turn == 'player1') {
            //this.drawPlayerPoints('player1');
        }

        this.af = window.requestAnimationFrame(this.gameloop);
    };

    this.drawPlayerPoints = (player) => {
        let draw_function = player === "player1" ? 'color_msg_player1' : 'color_msg';
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

    this.color_msg = (addr, color) => {
        return ['0x90', `${addr}`, `${color}`];
    }
    this.color_msg_player1 = (addr, color) => {
        return ['0xb0', `${addr}`, `${color}`];
    }
}


export { Game };
