<!-- App.vue -->
<template>
  <div class="app-container">
    <SpotifyBattle />
  </div>
</template>

<script>
import SpotifyBattle from './components/SpotifyBattle.vue';

export default {
  name: 'App',
  components: {
    SpotifyBattle
  }
}
</script>

<style>
/* Reset default margins and padding */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  width: 100%;
  overflow-x: hidden;
  background: #121212;  /* Spotify's dark theme */
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #FFFFFF;  /* Light text for dark theme */
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  margin: 0;  /* Remove top margin */
}

.app-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  width: 100%;
}
</style>