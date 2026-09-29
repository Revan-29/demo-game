# Warriors of the Lost Treasure

A browser-playable Three.js 3D prototype for a Gameathon.

## Features

- Third-person 3D camera
- WASD movement
- Shift sprint
- Space sword attack
- F to steal treasure
- Enemy AI
- Health and stamina
- Life Essence pickup
- Treasure chests
- Procedural terrain, trees, rocks and ruins
- Dynamic lighting and fog
- Procedural sound effects using Web Audio API
- Login/start screen
- Victory and defeat screens
- Restart flow
- No external 3D model files required

## Run

Requirements:
- Node.js 18+ recommended

Commands:

```bash
npm install
npm run dev
```

Open the local Vite URL shown in the terminal.

## Game loop

1. Enter your warrior name.
2. Move through the wilderness.
3. Find the rival warrior.
4. Attack with Space.
5. Defeat the rival.
6. Move to the red enemy treasure chest.
7. Press F repeatedly to steal 25 gold per interaction.
8. Reach 100 gold to win.
9. If health reaches zero, you lose.

## Next upgrade

For a production/Gameathon build, add:
- GLTF warrior models and real animation clips
- Real sword/impact audio files
- Touch controls
- Main menu settings
- Better terrain textures
- Inventory/upgrades
- Multiple enemy types
- Multiplayer/backend
- Persistent player accounts
- Leaderboards
