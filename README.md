# PS2Sync Addon for Decky

A Decky Loader addon to synchronize PS2 game saves between PCSX2 and SD2PSX (MMCE) emulators on your SteamDeck.

## Features

- 🔄 **PULL**: Sync saves from SD2PSX memory card to PCSX2
- 🔄 **PUSH**: Sync saves from PCSX2 back to SD2PSX memory card
- 📱 **Mount SD**: Automatically mount FAT32 SD card (useful in gaming mode)
- 📊 **Live Console**: Real-time output logging with color-coded messages
- ✨ **Verbose Mode**: Optional debug output
- 🛡️ **Auto Backup**: Script creates backups before sync operations

## Installation

### Prerequisites

1. [Decky Loader](https://github.com/SteamDeckHomebrew/decky-loader) installed
2. `ps2sync.sh` script located at `/home/deck/SD2PSX/ps2sync.sh`
3. MMCE (SD2PSX) card set up with PS2 memory cards
4. PCSX2 emulator installed in `/home/deck/Emulation/saves/pcsx2/saves`

### Install the Addon

1. Download or clone this repository
2. Copy the addon folder to:
   ```bash
   ~/.local/share/decky/plugins/ps2sync-decky/
   ```
3. Restart Decky Loader or reboot your SteamDeck
4. The addon should appear in the Decky menu

## Usage

### PULL (SD2PSX → PCSX2)

Use this **before** playing on PCSX2 emulator to sync your latest saves from the SD2PSX handheld.

1. Click the **PULL** button
2. The addon will:
   - Verify the SD card is mounted
   - Extract all saves from SD2PSX memory cards
   - Import them into PCSX2 format
   - Create a backup of your PCSX2 saves
3. Check the console for status updates

### PUSH (PCSX2 → SD2PSX)

Use this **after** playing on PCSX2 emulator to sync your updated saves back to the handheld.

1. Click the **PUSH** button
2. The addon will:
   - Create a backup of your SD2PSX memory cards
   - Extract all saves from PCSX2
   - Import them into the SD2PSX memory cards
   - Clean up old backups (keeps last 5 of each type)
3. Check the console for status updates

### Mount SD Card

In gaming mode, FAT32 SD cards don't mount automatically. Use this button to:

1. Click **Mount SD Card**
2. The addon will:
   - Detect your SD card device
   - Create the mount point if needed
   - Mount the SD2PSX card to `/run/media/deck/MMCE`
3. You should see the success message in the console

### Verbose Mode

Toggle **Verbose mode (-v)** to enable debug output from the ps2sync script. Useful for troubleshooting.

## Console Output

The addon displays live console output with color-coded messages:

- 🟢 **Green** (`✓`): Success messages
- 🔵 **Blue** (`→`, `🚀`): Operations and progress
- 🔴 **Red** (`❌`, `ERREUR`): Errors
- ⚫ **Gray** (`===`): Separators

## Troubleshooting

### "SD card not mounted"

- Click **Mount SD Card** button to mount it
- If still not working, check if the card is inserted
- Try manually mounting: `sudo mount -t vfat /dev/sda1 /run/media/deck/MMCE`

### "ps2sync.sh not found"

- Ensure the script is at `/home/deck/SD2PSX/ps2sync.sh`
- Check file permissions: `chmod +x /home/deck/SD2PSX/ps2sync.sh`

### Save sync fails

- Enable **Verbose mode** to see detailed debug output
- Check console for specific error messages
- Ensure you have enough space on both devices
- Verify `mymcplus` is installed: `which mymcplus`

### Permissions issues

- The addon runs commands as the `deck` user
- For mount operations, ensure `sudo` is configured (usually pre-configured on SteamDeck)
- Check `/etc/sudoers.d/` for decky permissions

## Backups

The ps2sync script automatically creates backups:

- **PULL backups**: `/home/deck/SD2PSX/backup/pcsx2/YYYYMMDD_HHMMSS/`
- **PUSH backups**: `/home/deck/SD2PSX/backup/sd2psx/YYYYMMDD_HHMMSS/`
- **Retention**: Last 5 backups of each type are kept

You can restore manually if needed.

## Requirements

- Python 3.7+
- Bash
- `mymcplus` (for PS2 memory card operations)
- `lsblk` (for SD card detection)
- `sudo` access (for mounting)

## License

MIT

## Credits

- Addon created for use with `ps2sync.sh`
- Built with [Decky Frontend Lib](https://github.com/SteamDeckHomebrew/decky-frontend-lib)
- Uses React and TypeScript for the UI

## Support

For issues or feature requests, please create an issue on the GitHub repository.
