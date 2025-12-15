use bevy::prelude::*;

pub struct PlayerPlugin;

impl Plugin for PlayerPlugin {
    fn build(&self, app: &mut App) {
        app.add_systems(Startup, init_players);
        app.add_systems(Update, (hello_world, list_players));
    }
}


#[derive(Component)]
struct Player {
    points: u8
}

#[derive(Component)]
struct Name(String);


fn hello_world() {
    println!("hello world!");
}


fn init_players(mut commands: Commands) {
    commands.spawn((Player { points: 0}, Name("top".to_string())));
    commands.spawn((Player { points: 0}, Name("side".to_string())));
}

fn list_players(query: Query<(&Player, &Name)>) {
    for (player, name) in &query {
        println!("Player {} has {} points", name.0, player.points);
    }
}
