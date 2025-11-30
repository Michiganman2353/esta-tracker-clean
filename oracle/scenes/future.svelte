<script>
  import { onMount } from 'svelte';
  onMount(() => {
    console.log("Oracle awakens — your future is loading...");
  });
</script>

<a-scene embedded arjs>
  <a-box position="0 0.5 -3" color="#FFD700" shadow></a-box>
  <a-text value="Your sick-time future" position="0 2 -3" color="white"></a-text>
</a-scene>
