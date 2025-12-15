use bevy::prelude::*;
use bevy_midi::prelude::*;

mod plugins;
use plugins::PlayerPlugin;

fn main() {
    App::new()
        .add_plugins(DefaultPlugins)
        .add_plugins(PlayerPlugin)
        .run();
}

