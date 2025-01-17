//src/components/SpotifyBattle.vue
<template>
  <div class="app-container">
    <div class="spotify-battle">
      <!-- Header -->
      <header class="header">
        <div class="logo-container">
          <img src="@/assets/spotify-logo.png" alt="Spotify" class="spotify-logo">
          <h1>Battle</h1>
        </div>
      </header>

      <!-- Login Section -->
      <div v-if="!accessToken" class="login-section">
        <div class="hero-content">
          <h1 class="gradient-text">Song vs Song</h1>
          <p class="subtitle">Let your favorite tracks battle it out!</p>
          <button @click="handleLogin" class="login-button">
            <img src="@/assets/spotify-icon.png" alt="" class="button-icon">
            Connect with Spotify
          </button>
        </div>
        <div class="background-gradient"></div>
      </div>

      <!-- Playlist Input Section -->
      <div v-else-if="!playlistLoaded" class="playlist-input-section">
        <div class="content-card">
          <h2>Enter Your Playlist</h2>
          <p class="instruction-text">Paste a Spotify playlist URL to start the battle</p>
          <div class="input-group">
            <input 
              v-model="playlistUrl" 
              placeholder="https://open.spotify.com/playlist/..."
              class="playlist-input"
            >
            <button 
              @click="loadPlaylist" 
              :disabled="!isValidPlaylistUrl"
              class="submit-button"
            >
              Start Battle
            </button>
          </div>
        </div>
      </div>

      <!-- Battle Section -->
      <div v-else-if="currentBattle" class="battle-section">
        <h2 class="battle-title">Round {{ battleCount }}</h2>
        <div class="versus-indicator">VS</div>
        <div class="battle-cards">
          <div class="song-card left" :class="{ 'voted': votedSong === 'left' }">
            <div class="player-wrapper">
              <iframe 
                :src="`https://open.spotify.com/embed/track/${currentBattle.song1.id}?utm_source=generator`"
                width="100%" 
                height="352" 
                frameBorder="0" 
                allowfullscreen="" 
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                loading="lazy"
                class="spotify-player"
              ></iframe>
            </div>
            <button 
              @click="selectWinner(currentBattle.song1, 'left')"
              class="vote-button"
              :disabled="votedSong !== null"
            >
              Vote for this song
            </button>
          </div>

          <div class="song-card right" :class="{ 'voted': votedSong === 'right' }">
            <div class="player-wrapper">
              <iframe 
                :src="`https://open.spotify.com/embed/track/${currentBattle.song2.id}?utm_source=generator`"
                width="100%" 
                height="352" 
                frameBorder="0" 
                allowfullscreen="" 
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                loading="lazy"
                class="spotify-player"
              ></iframe>
            </div>
            <button 
              @click="selectWinner(currentBattle.song2, 'right')"
              class="vote-button"
              :disabled="votedSong !== null"
            >
              Vote for this song
            </button>
          </div>
        </div>
      </div>

      <!-- Winner Section -->
      <div v-else-if="winner" class="winner-section">
        <div class="winner-content">
          <div class="trophy-animation">🏆</div>
          <h2 class="gradient-text">Champion!</h2>
          <div class="winner-card">
            <iframe 
              :src="`https://open.spotify.com/embed/track/${winner.id}?utm_source=generator`"
              width="100%" 
              height="352" 
              frameBorder="0" 
              allowfullscreen="" 
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
              loading="lazy"
              class="spotify-player"
            ></iframe>
          </div>
          <button @click="resetBattle" class="reset-button">
            Start New Battle
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

// src/components/SpotifyBattle.vue - Script section
<script>
import axios from 'axios';

export default {
  name: 'SpotifyBattle',
  data() {
    return {
      clientId: 'fe4fe373d6b84f8b8fc574b22d86928b',
      accessToken: null,
      playlistUrl: '',
      playlistLoaded: false,
      songs: [],
      currentBattle: null,
      winner: null,
      battleHistory: [],
      votedSong: null,
      battleCount: 1,
      isLoading: false,
      tournamentBracket: [],
      currentRound: 0,
      roundNames: ['Finals', 'Semi-Finals', 'Quarter-Finals', 'Round of 16', 'Round of 32']
    }
  },

  computed: {
    isValidPlaylistUrl() {
      return this.playlistUrl.includes('open.spotify.com/playlist/');
    }
  },

  methods: {
    handleLogin() {
      const redirectUri = `${window.location.origin}/callback`;
      const scope = 'playlist-read-private playlist-read-collaborative';
      const state = Math.random().toString(36).substring(7);
      localStorage.setItem('spotify_auth_state', state);
      
      const authUrl = `https://accounts.spotify.com/authorize?client_id=${this.clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}`;
      window.location.href = authUrl;
    },

    createTournamentBracket(songs) {
      // Shuffle all songs first
      let shuffledSongs = [...songs].sort(() => Math.random() - 0.5);
      
      // If odd number of songs, add a "bye" song
      if (shuffledSongs.length % 2 !== 0) {
        shuffledSongs.push({
          id: 'bye',
          title: 'Bye',
          artist: 'Automatic Winner',
          isBye: true
        });
      }

      // Create pairs for first round
      const pairs = [];
      for (let i = 0; i < shuffledSongs.length; i += 2) {
        pairs.push({
          song1: shuffledSongs[i],
          song2: shuffledSongs[i + 1],
          winner: null,
          roundIndex: 0
        });
      }

      this.tournamentBracket = [pairs];
      this.currentRound = 0;

      return pairs;
    },

    async loadPlaylist() {
      this.isLoading = true;
      try {
        const playlistId = this.playlistUrl.split('/playlist/')[1].split('?')[0];
        
        const response = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        });

        this.songs = response.data.items
          .filter(item => item.track) // Filter out any null tracks
          .map(item => ({
            id: item.track.id,
            title: item.track.name,
            artist: item.track.artists.map(artist => artist.name).join(', '),
            uri: item.track.uri
          }));

        // Create tournament bracket and start first round
        this.createTournamentBracket(this.songs);
        this.playlistLoaded = true;
        this.setupNextBattle();
      } catch (error) {
        this.handleError(error);
      } finally {
        this.isLoading = false;
      }
    },

    setupNextBattle() {
      // Find next unplayed match in current round
      const currentRoundMatches = this.tournamentBracket[this.currentRound];
      const nextMatch = currentRoundMatches.find(match => match.winner === null);

      if (nextMatch) {
        // If there's a match to play in this round
        this.currentBattle = {
          song1: nextMatch.song1,
          song2: nextMatch.song2,
          matchIndex: currentRoundMatches.indexOf(nextMatch)
        };

        // Skip if it's a bye match
        if (nextMatch.song1.isBye || nextMatch.song2.isBye) {
          const winner = nextMatch.song1.isBye ? nextMatch.song2 : nextMatch.song1;
          this.selectWinner(winner, winner === nextMatch.song1 ? 'left' : 'right', true);
        }
      } else {
        // Round is complete, advance to next round
        this.advanceToNextRound();
      }
    },

    advanceToNextRound() {
      const currentRoundMatches = this.tournamentBracket[this.currentRound];
      const winners = currentRoundMatches.map(match => match.winner);

      // If only one winner, tournament is complete
      if (winners.length === 1) {
        this.winner = winners[0];
        this.currentBattle = null;
        return;
      }

      // Create next round pairs
      const nextRoundPairs = [];
      for (let i = 0; i < winners.length; i += 2) {
        nextRoundPairs.push({
          song1: winners[i],
          song2: winners[i + 1] || null,
          winner: null,
          roundIndex: this.currentRound + 1
        });
      }

      this.tournamentBracket.push(nextRoundPairs);
      this.currentRound++;
      this.setupNextBattle();
    },

    selectWinner(winner, side, skipAnimation = false) {
      if (!skipAnimation) {
        this.votedSong = side;
      }
      
      const processWinner = () => {
        this.votedSong = null;
        this.battleCount++;

        // Update the current match with the winner
        const currentRoundMatches = this.tournamentBracket[this.currentRound];
        const currentMatch = currentRoundMatches[this.currentBattle.matchIndex];
        currentMatch.winner = winner;

        // Record in battle history
        if (!skipAnimation) {
          this.battleHistory.push({
            winner: winner.id,
            loser: winner.id === this.currentBattle.song1.id 
              ? this.currentBattle.song2.id 
              : this.currentBattle.song1.id,
            round: this.getRoundName(this.currentRound)
          });
        }

        // Move to next battle
        this.setupNextBattle();
      };

      if (skipAnimation) {
        processWinner();
      } else {
        setTimeout(processWinner, 1000);
      }
    },

    getRoundName(roundIndex) {
      const totalRounds = Math.ceil(Math.log2(this.songs.length));
      const reversedIndex = totalRounds - roundIndex - 1;
      return this.roundNames[reversedIndex] || `Round ${roundIndex + 1}`;
    },

    getCurrentRoundName() {
      return this.getRoundName(this.currentRound);
    },

    resetBattle() {
      this.playlistLoaded = false;
      this.playlistUrl = '';
      this.songs = [];
      this.currentBattle = null;
      this.winner = null;
      this.battleHistory = [];
      this.votedSong = null;
      this.battleCount = 1;
      this.tournamentBracket = [];
      this.currentRound = 0;
    },

    handleError(error) {
      console.error('An error occurred:', error);
      if (error.response) {
        switch (error.response.status) {
          case 401:
            alert('Session expired. Please login again.');
            this.accessToken = null;
            break;
          case 404:
            alert('Playlist not found. Please check the URL.');
            break;
          default:
            alert('An error occurred. Please try again.');
        }
      } else {
        alert('Network error. Please check your connection.');
      }
    }
  },

  created() {
    // Check if returning from Spotify auth
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const token = params.get('access_token');
    
    if (token) {
      this.accessToken = token;
      window.location.hash = '';
    }

    // Restore session if exists
    const savedToken = localStorage.getItem('spotify_access_token');
    if (savedToken) {
      this.accessToken = savedToken;
    }
  },

  beforeUnmount() {
    // Clean up any timers or listeners
    if (this.votedSong) {
      clearTimeout(this.votedSong);
    }
  }
}</script>

<style scoped>
.app-container {
  min-height: 100vh;
  background: #121212;
  color: white;
}

.spotify-battle {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  padding: 20px 0;
  margin-bottom: 40px;
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.spotify-logo {
  height: 40px;
}

.gradient-text {
  background: linear-gradient(45deg, #1DB954, #1ed760);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-size: 4rem;
  font-weight: 800;
}

.login-section {
  text-align: center;
  padding: 100px 0;
  position: relative;
  overflow: hidden;
}

.hero-content {
  position: relative;
  z-index: 2;
}

.background-gradient {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at center, #1DB95433 0%, transparent 70%);
  animation: pulse 4s infinite;
}

.login-button {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px 30px;
  font-size: 1.2rem;
  margin: 30px auto;
  background: #1DB954;
  border: none;
  border-radius: 30px;
  color: white;
  cursor: pointer;
  transition: transform 0.2s, background-color 0.2s;
}

.login-button:hover {
  background: #1ed760;
  transform: scale(1.05);
}

.button-icon {
  width: 24px;
  height: 24px;
}

.playlist-input-section {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

.content-card {
  background: #282828;
  padding: 40px;
  border-radius: 20px;
  width: 100%;
  max-width: 600px;
  text-align: center;
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
}

.input-group {
  margin-top: 20px;
}

.playlist-input {
  width: 100%;
  padding: 15px;
  border: 2px solid #383838;
  border-radius: 8px;
  background: #383838;
  color: white;
  margin-bottom: 15px;
  transition: border-color 0.2s;
}

.playlist-input:focus {
  border-color: #1DB954;
  outline: none;
}

.battle-section {
  padding: 40px 0;
}

.battle-title {
  text-align: center;
  font-size: 2rem;
  margin-bottom: 40px;
  color: #1DB954;
}

.versus-indicator {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  font-size: 3rem;
  font-weight: 800;
  color: #1DB954;
  z-index: 2;
  text-shadow: 0 0 20px rgba(29, 185, 84, 0.5);
}

.battle-cards {
  display: flex;
  justify-content: space-between;
  gap: 40px;
  position: relative;
  margin: 40px 0;
}

.song-card {
  flex: 1;
  background: #282828;
  padding: 20px;
  border-radius: 20px;
  transition: transform 0.3s, box-shadow 0.3s;
  position: relative;
}

.song-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(29, 185, 84, 0.2);
}

.song-card.voted {
  transform: scale(1.05);
  box-shadow: 0 0 30px rgba(29, 185, 84, 0.3);
}

.player-wrapper {
  margin-bottom: 20px;
}

.spotify-player {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.vote-button {
  width: 100%;
  padding: 15px;
  border: none;
  border-radius: 12px;
  background: #1DB954;
  color: white;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.vote-button:hover:not(:disabled) {
  background: #1ed760;
  transform: scale(1.02);
}

.vote-button:disabled {
  background: #282828;
  cursor: not-allowed;
}

.winner-section {
  text-align: center;
  padding: 60px 0;
}

.winner-content {
  max-width: 600px;
  margin: 0 auto;
}

.trophy-animation {
  font-size: 5rem;
  margin-bottom: 20px;
  animation: bounce 1s infinite;
}

.reset-button {
  margin-top: 30px;
  padding: 15px 40px;
  border: none;
  border-radius: 30px;
  background: #1DB954;
  color: white;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.reset-button:hover {
  background: #1ed760;
  transform: scale(1.05);
}

@keyframes pulse {
  0% { opacity: 0.5; }
  50% { opacity: 0.8; }
  100% { opacity: 0.5; }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

@media (max-width: 768px) {
  .battle-cards {
    flex-direction: column;
  }
  
  .versus-indicator {
    top: 50%;
    transform: translate(-50%, -50%) rotate(90deg);
  }
  
  .gradient-text {
    font-size: 3rem;
  }
}
</style>