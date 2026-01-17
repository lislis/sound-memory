const color_map = {
  yellow: '0x15',
  red: '0x63',
  green: '0x60',
};


function color_msg(addr, color) {
  return ['0x90', `${addr}`, `${color}`];
}


function Game(output, input) {
  this.output = output;
  this.input = input;
  this.grid = [];
  this.player1 = [];
  this.player2 = [];

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
    // player button addresses are a bit weird...

    let count_up = [68, 69, '6a', '6b', '6c', '6d', '6e', '6f'];
    for (let i = 0; i <= 7; i++) {
      this.player1.push({ addr: `0x${count_up[i]}`});
    }

    for (let i = 0; i <= 7; i++) {
      this.player2.push({ addr: `0x${i}8`});
    }
  };

  this.start_game = () => {
    this.init_grid();
    this.init_players();

    this.grid.forEach(x => {
      this.output.send(color_msg(x.addr, color_map.yellow));
    });
  };

}


export { Game };
